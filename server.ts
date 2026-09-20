import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  encryptAes256,
  decryptAes256,
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  checkRateLimit,
} from './server/security.ts';
import { taskQueue } from './server/queue.ts';
import { saveAssetToCloud, getUserAssets, deleteAsset } from './server/storage.ts';
import { generateMentorResponse, enhancePrompt, generateFilmScript, generateFilmDirection } from './server/gemini.ts';
import { UserProfile, PaymentTransaction, TransactionRecord } from './server/types.ts';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Powered-By', 'iCALLOG-v18-CoreEngine');
  next();
});

// Rate limiting middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait 60 seconds.' });
  }
  next();
});

// ====================================================================
// In-Memory Database (Synced with Schema Structure)
// ====================================================================
const usersMap = new Map<string, UserProfile & { passwordHash: string }>();
const paymentTransactions = new Map<string, PaymentTransaction>();
const chatMemory = new Map<string, Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>>();
const userTransactions: TransactionRecord[] = [
  {
    id: 'tx-welcome-001',
    userId: 'demo_user',
    type: 'credit',
    category: 'welcome',
    amountRupees: 0,
    tokenAmount: 50,
    balanceAfter: 50,
    description: 'Welcome Sign-up Bonus & Initial Sandbox Grant',
    referenceId: 'REF-WELCOME-SYS-50',
    status: 'completed',
    paymentMethod: 'SYSTEM',
    timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

// Helper: Record new transaction in ledger
function recordTransaction(
  userId: string,
  type: 'credit' | 'debit',
  category: 'recharge' | 'bonus' | 'generation' | 'refund' | 'admin_grant' | 'welcome',
  tokenAmount: number,
  description: string,
  options?: {
    amountRupees?: number;
    referenceId?: string;
    status?: 'completed' | 'pending' | 'failed';
    paymentMethod?: 'UPI_QR' | 'CARD' | 'SYSTEM' | 'ADMIN';
    balanceAfter?: number;
  }
): TransactionRecord {
  const user = usersMap.get(userId) || usersMap.get('demo_user');
  const record: TransactionRecord = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: userId || 'demo_user',
    type,
    category,
    amountRupees: options?.amountRupees,
    tokenAmount,
    balanceAfter: options?.balanceAfter ?? (user ? user.tokenBalance : undefined),
    description,
    referenceId: options?.referenceId || `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: options?.status || 'completed',
    paymentMethod: options?.paymentMethod || (type === 'credit' ? 'UPI_QR' : 'SYSTEM'),
    timestamp: new Date().toISOString(),
  };
  userTransactions.unshift(record); // newest first
  broadcastSse('TRANSACTION_RECORDED', { transaction: record, userId: record.userId });
  return record;
}

// Seed default users
const defaultHashedPassword = hashPassword('iCallog2026!');
usersMap.set('demo_user', {
  id: 'demo_user',
  name: 'Creative Master',
  username: 'CreativeMaster',
  email: 'jayupadhyay2857@gmail.com',
  contactEmail: 'jayupadhyay2857@gmail.com',
  phone: '+91 9876543210',
  countryCode: '+91',
  whatsapp: '+91 9876543210',
  address: 'Mumbai, Maharashtra, India',
  passwordHash: defaultHashedPassword,
  role: 'creator_override',
  personaType: 'creator',
  activeProfileId: 'sub_prof_creator',
  isExplicitUnlocked: true,
  explicitAccessMode: 'free_creator',
  subProfiles: [
    {
      id: 'sub_prof_creator',
      name: 'Jay Upadhyay (Creator Master)',
      personaType: 'creator',
      title: 'Master Director & Creator Override',
      badgeLabel: 'Creator Pro (Free Pass)',
      badgeColor: '#f59e0b',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      bio: 'Master Unrestricted Access for Jay: 8K Video, 3D, Film Scripting & Mature VFX.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sub_prof_general',
      name: 'Jay (General Studio)',
      personaType: 'general',
      title: 'Master Account (General Studio)',
      badgeLabel: 'General Studio',
      badgeColor: '#6366f1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      bio: 'All-around 3D, Video, and Script creation sandbox.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sub_prof_teacher',
      name: 'Prof. Jay Upadhyay',
      personaType: 'teacher',
      title: 'Educator & Academic Mentor',
      badgeLabel: 'Teacher / Educator',
      badgeColor: '#10b981',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
      bio: 'Course presentations, lesson scripts, student materials.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sub_prof_student',
      name: 'Jay (Learner Mode)',
      personaType: 'student',
      title: 'Student & Research Scholar',
      badgeLabel: 'Student Scholar',
      badgeColor: '#06b6d4',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
      bio: 'AI-assisted study, 3D science anatomy models.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sub_prof_pro',
      name: 'iCALLOG VFX Studio',
      personaType: 'professional',
      title: 'Studio Professional',
      badgeLabel: 'Studio Pro',
      badgeColor: '#8b5cf6',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
      bio: 'High precision 8K rendering, enterprise commercial licenses.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sub_prof_guest',
      name: 'Guest Sandbox',
      personaType: 'guest',
      title: 'Guest Account (Free Tier Sandbox)',
      badgeLabel: 'Guest Sandbox',
      badgeColor: '#64748b',
      isGuest: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      bio: 'Free tier sandbox trial mode.',
      createdAt: new Date().toISOString(),
    },
  ],
  tokenBalance: 999999, // Unlimited Tokens for Jay Master Creator
  vipTier: 'diamond',
  vipExpiry: '2099-12-31T23:59:59.999Z',
  createdAt: new Date().toISOString(),
});

// SSE Client Connection Pool for Real-Time Live Auto-Sync
const sseClients = new Set<Response>();

export function broadcastSse(eventType: string, data: Record<string, unknown>) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Subscribe taskQueue events to broadcast to all clients in real-time
taskQueue.on('taskUpdate', (job) => {
  broadcastSse('TASK_UPDATE', { job });
});

// Helper: Deduct tokens safely
function deductUserTokens(userId: string, amount: number, reason: string): boolean {
  const user = usersMap.get(userId) || usersMap.get('demo_user');
  if (!user) return false;
  
  // Unlimited tokens if admin / creator_override
  if (user.role === 'creator_override' || user.role === 'admin') {
    broadcastSse('TOKEN_UPDATE', { userId: user.id, tokenBalance: user.tokenBalance, delta: 0, reason });
    recordTransaction(user.id, 'debit', 'generation', 0, `${reason} (VIP/Admin Pass - 0 Deducted)`, {
      balanceAfter: user.tokenBalance,
      paymentMethod: 'ADMIN',
    });
    return true;
  }

  if (user.tokenBalance < amount) return false;
  user.tokenBalance -= amount;
  broadcastSse('TOKEN_UPDATE', { userId: user.id, tokenBalance: user.tokenBalance, delta: -amount, reason });
  recordTransaction(user.id, 'debit', 'generation', amount, reason, {
    balanceAfter: user.tokenBalance,
    paymentMethod: 'SYSTEM',
  });
  return true;
}

// Helper: Credit tokens safely
function creditUserTokens(
  userId: string,
  amount: number,
  reason: string,
  options?: {
    amountRupees?: number;
    referenceId?: string;
    paymentMethod?: 'UPI_QR' | 'CARD' | 'SYSTEM' | 'ADMIN';
  }
): number {
  const user = usersMap.get(userId) || usersMap.get('demo_user')!;
  user.tokenBalance += amount;
  broadcastSse('TOKEN_UPDATE', { userId: user.id, tokenBalance: user.tokenBalance, delta: amount, reason });
  recordTransaction(user.id, 'credit', options?.amountRupees ? 'recharge' : 'bonus', amount, reason, {
    amountRupees: options?.amountRupees,
    referenceId: options?.referenceId,
    balanceAfter: user.tokenBalance,
    paymentMethod: options?.paymentMethod || 'UPI_QR',
  });
  return user.tokenBalance;
}

// ====================================================================
// REST API ROUTES
// ====================================================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'iCALLOG V18 Operational Gateway',
    version: '18.0.0-PROD',
    activeConnections: sseClients.size,
    timestamp: new Date().toISOString(),
  });
});

// 1. SSE Real-Time Live Stream Connection (Zero-refresh Auto-Sync Engine)
app.get('/api/sync/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial handshake
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ message: 'iCALLOG Real-Time Auto-Sync Connected', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 2. Authentication: Register / Login
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  const existing = Array.from(usersMap.values()).find((u) => u.email === email || u.username === username);
  if (existing) {
    return res.status(400).json({ error: 'Account with this email or username already exists' });
  }

  const id = `user-${crypto.randomUUID()}`;
  const newUser = {
    id,
    username,
    email,
    passwordHash: hashPassword(password),
    role: 'user' as const,
    tokenBalance: 50, // 50 Free Initial Tokens
    vipTier: 'free' as const,
    vipExpiry: null,
    createdAt: new Date().toISOString(),
  };

  usersMap.set(id, newUser);
  const token = signJwt({ id, username, email, role: newUser.role });

  const { passwordHash: _, ...userProfile } = newUser;
  res.json({ token, user: userProfile });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = Array.from(usersMap.values()).find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials. Check email and password.' });
  }

  const token = signJwt({ id: user.id, username: user.username, email: user.email, role: user.role });
  const { passwordHash: _, ...userProfile } = user;
  res.json({ token, user: userProfile });
});

// Extend / Refresh session token
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.token;
  const extendMinutes = Number(req.body?.extendMinutes) || 15;
  
  let payload: Record<string, unknown> = { id: 'demo_user', role: 'user', email: 'creator@icallog.studio' };
  if (token) {
    const verified = verifyJwt<Record<string, unknown>>(token);
    if (verified) {
      payload = { ...verified };
      delete payload.exp;
    }
  }
  
  const newToken = signJwt(payload, 24);
  const newExpiresAt = Date.now() + extendMinutes * 60 * 1000;
  
  res.json({
    success: true,
    token: newToken,
    expiresAt: newExpiresAt,
    expiresInSeconds: extendMinutes * 60,
    message: `Session token extended by ${extendMinutes} minutes.`,
  });
});

app.get('/api/user/profile', (req: Request, res: Response) => {
  const user = usersMap.get('demo_user')!;
  const { passwordHash: _, ...userProfile } = user;
  res.json({ user: userProfile });
});

app.post('/api/user/profile', (req: Request, res: Response) => {
  const {
    name,
    username,
    avatarUrl,
    email,
    language,
    phone,
    contactEmail,
    countryCode,
    whatsapp,
    address,
    personaType,
    activeProfileId,
    subProfiles,
  } = req.body || {};
  const user = usersMap.get('demo_user')!;
  if (name !== undefined) user.name = name;
  if (username !== undefined) user.username = username;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (email !== undefined) user.email = email;
  if (language !== undefined) user.language = language;
  if (phone !== undefined) user.phone = phone;
  if (contactEmail !== undefined) user.contactEmail = contactEmail;
  if (countryCode !== undefined) user.countryCode = countryCode;
  if (whatsapp !== undefined) user.whatsapp = whatsapp;
  if (address !== undefined) user.address = address;
  if (personaType !== undefined) user.personaType = personaType;
  if (activeProfileId !== undefined) user.activeProfileId = activeProfileId;
  if (subProfiles !== undefined) user.subProfiles = subProfiles;
  const { passwordHash: _, ...userProfile } = user;
  res.json({ success: true, user: userProfile });
});

// Transactions & Ledger API
app.get('/api/user/transactions', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'demo_user';
  const user = usersMap.get(userId) || usersMap.get('demo_user')!;
  
  // Filter user's transactions
  const txs = userTransactions.filter((t) => t.userId === userId || t.userId === 'demo_user');
  
  // Compute summary stats
  const totalCredited = txs
    .filter((t) => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.tokenAmount, 0);
  const totalDebited = txs
    .filter((t) => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.tokenAmount, 0);
  const totalSpentInr = txs
    .filter((t) => t.amountRupees && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amountRupees || 0), 0);

  res.json({
    success: true,
    transactions: txs,
    summary: {
      totalTransactions: txs.length,
      currentBalance: user.tokenBalance,
      totalCreditedTokens: totalCredited,
      totalDebitedTokens: totalDebited,
      totalSpentInr,
      userRole: user.role,
      vipTier: user.vipTier,
    },
  });
});

// 3. Secret Admin Override & Security (Passcode: CREATOR_ADMIN_786)
app.post('/api/admin/override', (req: Request, res: Response) => {
  const { passcode, userId = 'demo_user' } = req.body;
  const validPasscodes = ['CREATOR_ADMIN_786'];
  if (process.env.ADMIN_OVERRIDE_PASSCODE) {
    validPasscodes.push(process.env.ADMIN_OVERRIDE_PASSCODE);
  }

  if (!validPasscodes.includes(passcode)) {
    return res.status(403).json({
      success: false,
      error: 'Security Breach: Invalid Creator Admin Passcode. Action logged.',
    });
  }

  const user = usersMap.get(userId) || usersMap.get('demo_user')!;
  user.role = 'creator_override';
  user.tokenBalance = 999999; // Unlimited bypass tokens
  user.vipTier = 'diamond';
  user.vipExpiry = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

  // Record Master Admin Passcode Grant in ledger
  recordTransaction(user.id, 'credit', 'admin_grant', 999999, 'Master Admin Passcode Override Grant', {
    referenceId: 'REF-MASTER-ADMIN-AUTH',
    paymentMethod: 'ADMIN',
    balanceAfter: 999999,
  });

  // Encrypt override receipt with AES-256
  const encryptedAudit = encryptAes256(
    JSON.stringify({
      adminOverrideGranted: true,
      passcodeUsed: 'CREATOR_ADMIN_786',
      unlimitedTokens: 999999,
      timestamp: new Date().toISOString(),
    })
  );

  broadcastSse('ADMIN_OVERRIDE', {
    userId: user.id,
    role: user.role,
    vipTier: user.vipTier,
    tokenBalance: user.tokenBalance,
    message: 'Master Key validated! VIP Diamond & Unlimited Tokens Unlocked.',
  });

  const { passwordHash: _, ...profile } = user;
  res.json({
    success: true,
    message: 'Master Key Authenticated! Unlimited tokens and VIP Diamond granted.',
    user: profile,
    auditSignature: encryptedAudit,
  });
});

// 4. Dynamic UPI QR Payment Gateway (GPay, PhonePe, Paytm, Cards - NO CRYPTO)
app.post('/api/payment/generate-qr', (req: Request, res: Response) => {
  const { planName, priceInr, tokens, paymentMethod = 'UPI_QR' } = req.body;
  const txnId = `TXN-UPI-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // Real UPI intent payload formatted according to NPCI specs
  const upiId = 'icallog@icici';
  const payeeName = 'iCALLOG Creative AI';
  const amount = priceInr || 200;
  const note = `Token recharge for ${tokens || 500} tokens`;
  const upiPayload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}.00&cu=INR&tn=${encodeURIComponent(note)}&tr=${txnId}`;

  const transaction: PaymentTransaction = {
    txnId,
    userId: 'demo_user',
    amountInr: amount,
    tokensCredited: tokens || 500,
    paymentMethod: paymentMethod as PaymentTransaction['paymentMethod'],
    status: 'pending',
    qrPayload: upiPayload,
    createdAt: new Date().toISOString(),
  };

  paymentTransactions.set(txnId, transaction);

  res.json({
    success: true,
    txnId,
    amountInr: amount,
    tokens: transaction.tokensCredited,
    upiPayload,
    upiId,
    planName: planName || 'VIP Tier Pack',
  });
});

// Payment Webhook (NPCI / Payment aggregator simulator)
app.post('/api/payment/webhook', (req: Request, res: Response) => {
  const { txnId, status = 'completed', upiRef } = req.body;
  const transaction = paymentTransactions.get(txnId);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction record not found' });
  }

  if (status === 'completed') {
    transaction.status = 'completed';
    const newBalance = creditUserTokens(transaction.userId, transaction.tokensCredited, `UPI Recharge: ₹${transaction.amountInr} (${transaction.tokensCredited} tokens)`, {
      amountRupees: transaction.amountInr,
      referenceId: txnId,
      paymentMethod: 'UPI_QR',
    });

    // Update VIP tier if price >= 200
    const user = usersMap.get(transaction.userId);
    if (user) {
      if (transaction.amountInr >= 2000) user.vipTier = 'diamond';
      else if (transaction.amountInr >= 1000) user.vipTier = 'gold';
      else if (transaction.amountInr >= 500) user.vipTier = 'silver';
      else if (transaction.amountInr >= 200) user.vipTier = 'bronze';
    }

    broadcastSse('PAYMENT_CONFIRMED', {
      txnId,
      amountInr: transaction.amountInr,
      tokensCredited: transaction.tokensCredited,
      newBalance,
      vipTier: user?.vipTier,
      message: `Payment of ₹${transaction.amountInr} confirmed via UPI! +${transaction.tokensCredited} tokens added.`,
    });

    return res.json({ success: true, message: 'Tokens credited to ledger successfully', newBalance });
  } else {
    transaction.status = 'failed';
    return res.json({ success: false, message: 'Payment marked failed' });
  }
});

// Instant payment simulation for testing the complete flow
app.post('/api/payment/verify-instant', (req: Request, res: Response) => {
  const { txnId } = req.body;
  const transaction = paymentTransactions.get(txnId);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  transaction.status = 'completed';
  const newBalance = creditUserTokens(transaction.userId, transaction.tokensCredited, `UPI Instant Recharge: ₹${transaction.amountInr} (${transaction.tokensCredited} tokens)`, {
    amountRupees: transaction.amountInr,
    referenceId: txnId,
    paymentMethod: 'UPI_QR',
  });
  
  const user = usersMap.get(transaction.userId);
  if (user) {
    if (transaction.amountInr >= 2000) user.vipTier = 'diamond';
    else if (transaction.amountInr >= 1000) user.vipTier = 'gold';
    else if (transaction.amountInr >= 500) user.vipTier = 'silver';
    else if (transaction.amountInr >= 200) user.vipTier = 'bronze';
  }

  broadcastSse('PAYMENT_CONFIRMED', {
    txnId,
    amountInr: transaction.amountInr,
    tokensCredited: transaction.tokensCredited,
    newBalance,
    vipTier: user?.vipTier,
    message: `Payment of ₹${transaction.amountInr} verified! +${transaction.tokensCredited} tokens auto-credited.`,
  });

  res.json({ success: true, newBalance, user });
});

// 5. AI Chatbot Mentor with Memory & Coding Assistance
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, sessionId = 'default-session', userId = 'demo_user' } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Prompt message is required' });
  }

  let sessionHistory = chatMemory.get(sessionId);
  if (!sessionHistory) {
    sessionHistory = [];
    chatMemory.set(sessionId, sessionHistory);
  }

  // Deduct 1 token for AI mentor query (free if admin)
  deductUserTokens(userId, 1, 'AI Mentor Query');

  const mentorAnswer = await generateMentorResponse(message, sessionHistory);

  // Update conversation memory
  sessionHistory.push({ role: 'user', parts: [{ text: message }] });
  sessionHistory.push({ role: 'model', parts: [{ text: mentorAnswer.text }] });

  // Keep last 16 turns in context memory
  if (sessionHistory.length > 16) {
    sessionHistory.splice(0, sessionHistory.length - 16);
  }

  res.json({
    text: mentorAnswer.text,
    codeSnippet: mentorAnswer.codeSnippet,
    sessionId,
  });
});

// 6. Quick Prompt Enhancer
app.post('/api/ai/enhance-prompt', async (req: Request, res: Response) => {
  const { prompt, type = 'image' } = req.body;
  const enhanced = await enhancePrompt(prompt || '', type);
  res.json({ enhancedPrompt: enhanced });
});

// 7. 240p to 8K Image Studio: Text-to-Image & Image-to-Image Generation
app.post('/api/ai/generate-image', (req: Request, res: Response) => {
  const { prompt, style = 'Cyberpunk', resolution = '8K', aspectRatio = '16:9', userId = 'demo_user' } = req.body;
  
  const imageTokenCostMap: Record<string, number> = {
    '240p': 2,
    '360p': 3,
    '480p': 5,
    '720p': 8,
    '1080p': 10,
    '2K': 14,
    '4K': 18,
    '8K': 25,
  };
  const tokenCost = imageTokenCostMap[resolution] || 10;

  if (!deductUserTokens(userId, tokenCost, `AI Image Generation (${resolution})`)) {
    return res.status(402).json({ error: `Insufficient tokens. You need ${tokenCost} tokens for ${resolution} generation.` });
  }

  // Enqueue AI rendering in Background Queue
  const job = taskQueue.enqueueJob(userId, '8k_image_render', {
    prompt,
    style,
    resolution,
    aspectRatio,
    tokens: tokenCost,
  });

  res.json({
    success: true,
    jobId: job.id,
    message: `Image Render dispatched to async queue. Processing at ${resolution} (${aspectRatio}).`,
    job,
  });
});

// AI Super-Resolution Upscale to 8K
app.post('/api/ai/upscale-8k', (req: Request, res: Response) => {
  const { imageUrl, targetResolution = '8K', userId = 'demo_user' } = req.body;
  const tokenCost = 15;
  if (!deductUserTokens(userId, tokenCost, 'AI 8K Super-Resolution Upscale')) {
    return res.status(402).json({ error: `Insufficient tokens. 8K Upscaling requires ${tokenCost} tokens.` });
  }
  const job = taskQueue.enqueueJob(userId, '8k_image_render', {
    imageUrl,
    targetResolution,
    isUpscale: true,
    tokens: tokenCost,
  });
  res.json({
    success: true,
    jobId: job.id,
    message: `AI Super-Resolution Upscaling dispatched to 8K engine.`,
    job,
  });
});

// 8. 240p to 8K Video & Animation Generator (Free: up to 1 Hour, Premium: Unlimited)
app.post('/api/ai/generate-video', (req: Request, res: Response) => {
  const {
    prompt,
    cinematicStyle = 'Hyper-lapse',
    resolution = '8K',
    fps = 60,
    duration = '8s',
    durationMinutes = 0.13,
    isUnlimited = false,
    userId = 'demo_user',
  } = req.body;

  const user = usersMap.get(userId) || usersMap.get('demo_user');
  const isPremiumUser =
    user &&
    (user.role === 'creator_override' ||
      user.role === 'admin' ||
      user.vipTier === 'diamond' ||
      user.vipTier === 'gold' ||
      user.vipTier === 'silver' ||
      user.vipTier === 'bronze');

  // Free Tier Policy: Max duration is 1 Hour (60 minutes)
  if (!isPremiumUser && (isUnlimited || durationMinutes > 60)) {
    return res.status(403).json({
      success: false,
      error:
        'Duration Limit: Free plan allows video duration up to 1 Hour. Please upgrade to VIP / Premium for Unlimited video rendering.',
    });
  }

  const videoTokenCostMap: Record<string, number> = {
    '240p': 5,
    '360p': 8,
    '480p': 12,
    '720p': 18,
    '1080p': 24,
    '2K': 30,
    '4K': 40,
    '8K': 50,
  };
  const tokenCost = videoTokenCostMap[resolution] || 35;

  if (!deductUserTokens(userId, tokenCost, `AI Video Generation (${resolution} ${fps}fps - ${duration})`)) {
    return res.status(402).json({ error: `Insufficient tokens. Video at ${resolution} requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, '8k_video_encode', {
    prompt,
    cinematicStyle,
    resolution,
    fps,
    duration,
    durationMinutes,
    isUnlimited,
    tokens: tokenCost,
  });

  const durationDisplay = isUnlimited ? 'Unlimited Master' : duration;

  res.json({
    success: true,
    jobId: job.id,
    message: `Video Encoding initialized at ${resolution} with ${fps} FPS (${durationDisplay}). Audio reactive visualizer synchronized.`,
    job,
  });
});

// 9. 3D Character Auto-Rigging Engine
app.post('/api/ai/auto-rig-3d', (req: Request, res: Response) => {
  const { modelName = 'Custom Biped Mesh', userId = 'demo_user' } = req.body;

  const tokenCost = 25;
  if (!deductUserTokens(userId, tokenCost, '3D Model Auto-Rigging')) {
    return res.status(402).json({ error: `Insufficient tokens. Auto-Rigging requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, '3d_auto_rig', {
    modelName,
    tokens: tokenCost,
  });

  res.json({
    success: true,
    jobId: job.id,
    message: '3D Skeleton Rigging pipeline initialized. Inverse kinematics & bone weights calculating.',
    job,
  });
});

// 10. Voice & Audio Generator
app.post('/api/ai/synthesize-voice', (req: Request, res: Response) => {
  const { text, voicePreset = 'Zephyr (Studio)', userId = 'demo_user' } = req.body;

  const tokenCost = 5;
  if (!deductUserTokens(userId, tokenCost, 'Voice Speech Synthesis')) {
    return res.status(402).json({ error: `Insufficient tokens. Voiceover requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, 'voice_synthesize', {
    text,
    voicePreset,
    tokens: tokenCost,
  });

  res.json({
    success: true,
    jobId: job.id,
    message: `Voiceover synthesis queued with ${voicePreset}.`,
    job,
  });
});

// 11. Image to 3D Model AI Generator
app.post('/api/ai/image-to-3d', (req: Request, res: Response) => {
  const {
    imageUrl = '',
    imagePrompt = 'Futuristic Cyber Biped Armor',
    meshDensity = 'Game-Ready (15k Polys)',
    rigBones = true,
    userId = 'demo_user',
  } = req.body;

  const tokenCost = 20;
  if (!deductUserTokens(userId, tokenCost, 'Image to 3D Model Synthesis')) {
    return res.status(402).json({ error: `Insufficient tokens. Image to 3D requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, 'image_to_3d', {
    imageUrl,
    imagePrompt,
    meshDensity,
    rigBones,
    tokens: tokenCost,
  });

  // Save generated 3D Model representation to cloud
  const asset = saveAssetToCloud({
    userId,
    assetType: '3d_model',
    title: `3D Mesh: ${imagePrompt.slice(0, 32)}`,
    prompt: imagePrompt,
    dataBase64OrUrl: imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    provider: 'AWS_S3',
  });

  res.json({
    success: true,
    jobId: job.id,
    message: `Image-to-3D Reconstruction queued (${meshDensity}). Neural marching cubes & bone topology calculating.`,
    asset,
    job,
  });
});

// 12. 3D Model to Video Cinematic Renderer
app.post('/api/ai/3d-to-video', (req: Request, res: Response) => {
  const {
    modelName = 'Cyber Android V18',
    cameraMotion = '360° Cinematic Turntable',
    lighting = 'Cyberpunk Neon Studio',
    resolution = '8K',
    fps = 60,
    duration = '15s',
    durationMinutes = 0.25,
    isUnlimited = false,
    userId = 'demo_user',
  } = req.body;

  const user = usersMap.get(userId) || usersMap.get('demo_user');
  const isPremiumUser =
    user &&
    (user.role === 'creator_override' ||
      user.role === 'admin' ||
      user.vipTier === 'diamond' ||
      user.vipTier === 'gold' ||
      user.vipTier === 'silver' ||
      user.vipTier === 'bronze');

  if (!isPremiumUser && (isUnlimited || durationMinutes > 60)) {
    return res.status(403).json({
      success: false,
      error: 'Duration Limit: Free plan allows video duration up to 1 Hour. Upgrade to VIP for Unlimited duration.',
    });
  }

  const tokenCost = resolution === '8K' ? 35 : 20;
  if (!deductUserTokens(userId, tokenCost, `3D Model to Video Render (${resolution})`)) {
    return res.status(402).json({ error: `Insufficient tokens. 3D to Video requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, '3d_to_video', {
    modelName,
    cameraMotion,
    lighting,
    resolution,
    fps,
    duration,
    tokens: tokenCost,
  });

  const asset = saveAssetToCloud({
    userId,
    assetType: 'video_8k',
    title: `3D Cinema: ${modelName} (${cameraMotion})`,
    prompt: `3D Model Render with ${lighting} and ${cameraMotion}`,
    dataBase64OrUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    provider: 'Cloudinary',
  });

  res.json({
    success: true,
    jobId: job.id,
    message: `3D-to-Video Raytracing initiated with ${cameraMotion} at ${resolution} (${duration}).`,
    asset,
    job,
  });
});

// 13. Image to Video Motion Animator
app.post('/api/ai/image-to-video', (req: Request, res: Response) => {
  const {
    imageUrl = '',
    prompt = 'Hyper-realistic atmospheric motion',
    motionType = 'Dynamic Dolly Zoom',
    motionIntensity = 7,
    resolution = '8K',
    fps = 60,
    duration = '30s',
    durationMinutes = 0.5,
    isUnlimited = false,
    userId = 'demo_user',
  } = req.body;

  const user = usersMap.get(userId) || usersMap.get('demo_user');
  const isPremiumUser =
    user &&
    (user.role === 'creator_override' ||
      user.role === 'admin' ||
      user.vipTier === 'diamond' ||
      user.vipTier === 'gold' ||
      user.vipTier === 'silver' ||
      user.vipTier === 'bronze');

  if (!isPremiumUser && (isUnlimited || durationMinutes > 60)) {
    return res.status(403).json({
      success: false,
      error: 'Duration Limit: Free plan allows video duration up to 1 Hour. Upgrade to VIP for Unlimited duration.',
    });
  }

  const tokenCost = resolution === '8K' ? 30 : 15;
  if (!deductUserTokens(userId, tokenCost, `Image to Video (${resolution})`)) {
    return res.status(402).json({ error: `Insufficient tokens. Image to Video requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, 'image_to_video', {
    imageUrl,
    prompt,
    motionType,
    motionIntensity,
    resolution,
    fps,
    duration,
    tokens: tokenCost,
  });

  const asset = saveAssetToCloud({
    userId,
    assetType: 'video_8k',
    title: `Image Motion: ${prompt.slice(0, 32)}`,
    prompt: `Image Animation with ${motionType} (Intensity ${motionIntensity})`,
    dataBase64OrUrl: imageUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=90',
    provider: 'Cloudinary',
  });

  res.json({
    success: true,
    jobId: job.id,
    message: `Image-to-Video synthesis queued with ${motionType} motion (${duration}).`,
    asset,
    job,
  });
});

// 14. Film Making - Script Writing Engine
app.post('/api/ai/film-script', async (req: Request, res: Response) => {
  const {
    title = 'Untitled Cinematic Masterpiece',
    genre = 'Cyberpunk Sci-Fi',
    logline = 'In 2099, a rogue neural hacker discovers a simulated reality within the mega-citadel.',
    characters = 'Aria (Neural operative), Marcus (Rebel leader), V18 (Synthetic AI)',
    tone = 'Gritty, atmospheric, high suspense',
    sceneCount = 2,
    userId = 'demo_user',
  } = req.body;

  const user = usersMap.get(userId) || usersMap.get('demo_user');
  const isPremiumUser =
    user && (user.role === 'creator_override' || user.role === 'admin' || user.vipTier !== 'free');

  const tokenCost = isPremiumUser ? 0 : 8;
  if (tokenCost > 0 && !deductUserTokens(userId, tokenCost, 'AI Screenplay Generation')) {
    return res.status(402).json({ error: `Insufficient tokens. Screenplay generation requires ${tokenCost} tokens.` });
  }

  try {
    const scriptResult = await generateFilmScript({
      title,
      genre,
      logline,
      characters,
      tone,
      sceneCount,
    });

    const asset = saveAssetToCloud({
      userId,
      assetType: 'screenplay',
      title: `Screenplay: ${title}`,
      prompt: `Screenplay for ${genre} - ${logline.slice(0, 60)}`,
      dataBase64OrUrl: 'data:text/plain;charset=utf-8,' + encodeURIComponent(scriptResult.screenplay),
      provider: 'AWS_S3',
    });

    res.json({
      success: true,
      script: scriptResult,
      asset,
      message: `Screenplay for "${title}" generated in Hollywood industry format.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Script generation failed';
    res.status(500).json({ error: msg });
  }
});

// 15. Film Making - Film Direction & Shot List Master
app.post('/api/ai/film-direction', async (req: Request, res: Response) => {
  const {
    script = '',
    directorStyle = 'Denis Villeneuve (Grand Epic Scale)',
    aspectRatio = '2.39:1 Anamorphic Cinema',
    lightingStyle = 'Three-Point High Contrast Chiaroscuro & Volumetric Haze',
    colorPalette = 'Teal and Amber Split-Tone LUT',
    userId = 'demo_user',
  } = req.body;

  const user = usersMap.get(userId) || usersMap.get('demo_user');
  const isPremiumUser =
    user && (user.role === 'creator_override' || user.role === 'admin' || user.vipTier !== 'free');

  const tokenCost = isPremiumUser ? 0 : 10;
  if (tokenCost > 0 && !deductUserTokens(userId, tokenCost, 'Film Direction Master Plan')) {
    return res.status(402).json({ error: `Insufficient tokens. Film Direction requires ${tokenCost} tokens.` });
  }

  try {
    const directionPlan = await generateFilmDirection({
      script,
      directorStyle,
      aspectRatio,
      lightingStyle,
      colorPalette,
    });

    const asset = saveAssetToCloud({
      userId,
      assetType: 'shotlist',
      title: `Director's Shot List (${directorStyle.slice(0, 20)})`,
      prompt: `Cinematic Director Plan in ${aspectRatio}`,
      dataBase64OrUrl: 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(directionPlan)),
      provider: 'AWS_S3',
    });

    res.json({
      success: true,
      directionPlan,
      asset,
      message: `Director's Production Plan and Master Shot List generated (${directorStyle}).`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Film direction planning failed';
    res.status(500).json({ error: msg });
  }
});

// 16. Human to AI Voice Converter
app.post('/api/ai/voice-convert', (req: Request, res: Response) => {
  const {
    targetVoice = 'Cinematic Movie Trailer (Deep Epic)',
    pitchShift = 0,
    formantStrength = 85,
    denoise = true,
    audioDurationSeconds = 12,
    userId = 'demo_user',
  } = req.body;

  const tokenCost = 6;
  if (!deductUserTokens(userId, tokenCost, 'Human-to-AI Voice Conversion')) {
    return res.status(402).json({ error: `Insufficient tokens. Voice conversion requires ${tokenCost} tokens.` });
  }

  const job = taskQueue.enqueueJob(userId, 'voice_convert', {
    targetVoice,
    pitchShift,
    formantStrength,
    denoise,
    audioDurationSeconds,
    tokens: tokenCost,
  });

  const asset = saveAssetToCloud({
    userId,
    assetType: 'voice_cloned',
    title: `Voice Clone: ${targetVoice}`,
    prompt: `Human voice converted to ${targetVoice} (Pitch: ${pitchShift}, Formant: ${formantStrength}%)`,
    dataBase64OrUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    provider: 'Cloudinary',
  });

  res.json({
    success: true,
    jobId: job.id,
    message: `Human voice morphing completed. Voice converted to ${targetVoice}.`,
    asset,
    job,
  });
});

// 17. Cloud Storage Asset Operations (AWS S3 / Cloudinary)
app.get('/api/storage/assets', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'demo_user';
  const assets = getUserAssets(userId);
  res.json({ assets });
});

app.post('/api/storage/save', (req: Request, res: Response) => {
  const { title, prompt, assetType, dataBase64OrUrl, provider, userId = 'demo_user' } = req.body;
  const asset = saveAssetToCloud({
    userId,
    assetType,
    title: title || 'Generated Asset',
    prompt: prompt || 'AI Creative Export',
    dataBase64OrUrl: dataBase64OrUrl || '',
    provider,
  });

  broadcastSse('ASSET_SAVED', { asset });
  res.json({ success: true, asset });
});

app.delete('/api/storage/assets/:id', (req: Request, res: Response) => {
  const assetId = req.params.id;
  const userId = (req.query.userId as string) || 'demo_user';
  const deleted = deleteAsset(assetId, userId);
  res.json({ success: deleted });
});

// 12. Task Queue Status
app.get('/api/tasks', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'demo_user';
  const tasks = taskQueue.getUserJobs(userId);
  res.json({ tasks });
});

// ====================================================================
// Vite Integration (Dev) & Static Serving (Prod)
// ====================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[iCALLOG V18] Server initialized on http://0.0.0.0:${PORT}`);
  });
}

startServer();
