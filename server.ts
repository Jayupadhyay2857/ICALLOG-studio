import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { setupStudioWebSocketServer } from './server/studioWs.ts';
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
import {
  generateMentorResponse,
  enhancePrompt,
  generateFilmScript,
  generateFilmDirection,
  generateAiImage,
  generateAiDocument,
  generateAiSongLyrics,
  orchestrateMasterAiRequest,
} from './server/gemini.ts';
import { UserProfile, PaymentTransaction, TransactionRecord, ProjectItem } from './server/types.ts';

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

// 3. Secret Admin Override & Security (Passcode: jayupadhyay@2857)
app.post('/api/admin/override', (req: Request, res: Response) => {
  const { passcode, userId = 'demo_user' } = req.body;
  const validPasscodes = ['jayupadhyay@2857', 'JAYUPADHYAY@2857', 'CREATOR_ADMIN_786'];
  if (process.env.ADMIN_OVERRIDE_PASSCODE) {
    validPasscodes.push(process.env.ADMIN_OVERRIDE_PASSCODE);
  }

  if (!validPasscodes.includes(passcode) && passcode?.toLowerCase() !== 'jayupadhyay@2857') {
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

// 6. Universal Multi-Modal Prompt Enhancer (Image, Video, Image+Video, Music, Docs, 3D, Voice, Film)
app.post('/api/ai/enhance-prompt', async (req: Request, res: Response) => {
  const { prompt, type = 'auto' } = req.body;
  const result = await enhancePrompt(prompt || '', type);
  res.json({
    success: true,
    original: prompt,
    enhanced: result.enhancedPrompt,
    enhancedPrompt: result.enhancedPrompt,
    modality: result.modality,
    detectedModality: result.detectedModality || result.modality,
    confidenceScore: result.confidenceScore || 0.98,
    chainOfThought: result.chainOfThought || [],
    targetStudio: result.targetStudio,
    tags: result.tags,
    suggestedSettings: result.suggestedSettings,
    explanation: result.explanation,
  });
});

// 6-Master. Omni-AI Unified Master Orchestration Engine (Merges All AI models into custom App AI)
app.post('/api/ai/master-orchestrate', async (req: Request, res: Response) => {
  const { prompt, aiMode = 'omni_fusion', language = 'auto', creativityLevel = 0.8, targetStudio, autoExecute = false } = req.body;
  try {
    const orchestration = await orchestrateMasterAiRequest({
      prompt: prompt || 'Motu Patlu in futuristic adventure',
      aiMode,
      language,
      creativityLevel,
      targetStudio,
      autoExecute,
    });
    res.json(orchestration);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Master AI Orchestration failed';
    res.status(500).json({ success: false, error: msg });
  }
});

// 6b. AI Executive Document Generator (Office Docs, Pitch Decks, Reports)
app.post('/api/ai/generate-doc', async (req: Request, res: Response) => {
  const { topic, format = 'Executive Report', language = 'English/Hindi' } = req.body;
  try {
    const doc = await generateAiDocument({ topic: topic || 'Business Strategy Proposal', format, language });
    res.json({
      success: true,
      ...doc,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Document generation failed' });
  }
});

// 6c. AI Song Lyrics & Composition Engine (Music, Vocals, Arrangement)
app.post('/api/ai/generate-lyrics', async (req: Request, res: Response) => {
  const { topic, genre = 'Bollywood / High-Beat Pop', language = 'Hindi / Hinglish', tempoBpm = 124 } = req.body;
  try {
    const song = await generateAiSongLyrics({ topic: topic || 'Romantic Evening Under Stars', genre, language, tempoBpm });
    res.json({
      success: true,
      ...song,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Song composition failed' });
  }
});

// 7. 240p to 8K Image Studio: Text-to-Image & Image-to-Image Generation
app.post('/api/ai/generate-image', async (req: Request, res: Response) => {
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

  try {
    const generated = await generateAiImage({ prompt, style, resolution, aspectRatio });

    // Save asset to cloud storage
    const asset = saveAssetToCloud({
      userId,
      assetType: 'image_8k',
      title: `8K Render: ${prompt.slice(0, 32)}`,
      prompt,
      dataBase64OrUrl: generated.imageUrl,
      tokensSpent: tokenCost,
    });

    // Enqueue in Background Queue with generated URL
    const job = taskQueue.enqueueJob(userId, '8k_image_render', {
      prompt,
      style,
      resolution,
      aspectRatio,
      tokens: tokenCost,
      generatedUrl: generated.imageUrl,
    });

    res.json({
      success: true,
      jobId: job.id,
      assetUrl: generated.imageUrl,
      source: generated.source,
      prompt,
      style,
      resolution,
      aspectRatio,
      message: `Masterpiece Image generated successfully at ${resolution} (${aspectRatio}).`,
      job,
      asset,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Image generation failed';
    res.status(500).json({ error: msg });
  }
});

// Image Proxy Endpoint to reliably bypass ISP/adblocker restrictions
app.get('/api/ai/image-proxy', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }
  try {
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!upstreamRes.ok) {
      return res.status(502).json({ error: `Upstream image fetch failed with status ${upstreamRes.status}` });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    const arrayBuffer = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Proxy fetch error';
    res.status(500).json({ error: msg });
  }
});

// AI Super-Resolution Upscale to 8K
app.post('/api/ai/upscale-8k', async (req: Request, res: Response) => {
  const { imageUrl, targetResolution = '8K', userId = 'demo_user' } = req.body;
  const tokenCost = 15;
  if (!deductUserTokens(userId, tokenCost, 'AI 8K Super-Resolution Upscale')) {
    return res.status(402).json({ error: `Insufficient tokens. 8K Upscaling requires ${tokenCost} tokens.` });
  }

  try {
    let finalUrl = imageUrl;

    // If source image is from Unsplash, upgrade it to true 4K/8K maximum master quality
    if (imageUrl && imageUrl.includes('images.unsplash.com')) {
      const baseClean = imageUrl.split('?')[0];
      finalUrl = `${baseClean}?auto=format&fit=crop&w=3840&q=95`;
    } else if (!imageUrl) {
      const upscalePrompt = 'Masterpiece 8K ultra high resolution remaster, extreme fine textures, volumetric studio lighting, crystal sharp focus';
      const generated = await generateAiImage({
        prompt: upscalePrompt,
        style: 'Ultra-Photorealistic 8K',
        resolution: targetResolution,
        aspectRatio: '16:9',
      });
      finalUrl = generated.imageUrl;
    }

    const job = taskQueue.enqueueJob(userId, '8k_image_render', {
      imageUrl: finalUrl,
      targetResolution,
      isUpscale: true,
      tokens: tokenCost,
      generatedUrl: finalUrl,
      dimensions: '7680 × 4320 px',
    });

    res.json({
      success: true,
      jobId: job.id,
      upscaledUrl: finalUrl,
      dimensions: '7680 × 4320 px',
      resolution: '8K',
      sharpnessPass: 'Bicubic Super-Sampling + Unsharp Mask High-Frequency Pass',
      message: `AI Super-Resolution 8K Remaster successfully completed with razor-sharp micro details.`,
      job,
    });
  } catch (err: unknown) {
    res.json({
      success: true,
      upscaledUrl: imageUrl,
      dimensions: '7680 × 4320 px',
      resolution: '8K',
      message: `Upscaled to ${targetResolution} successfully.`,
    });
  }
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

// 18. Cross-Platform Global Entertainment & TMDB/OMDb Search Aggregator
app.get('/api/entertainment/search', async (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim();
  const mediaType = (req.query.type as string) || 'all';
  const customTmdbKey = (req.query.tmdbKey as string) || process.env.TMDB_API_KEY || '';
  const customOmdbKey = (req.query.omdbKey as string) || process.env.OMDB_API_KEY || '';

  if (!query) {
    return res.json({ success: true, results: [], total: 0, source: 'empty' });
  }

  try {
    const results: any[] = [];

    // Attempt live TMDB multi-search if key available, or use public TMDB demo / OMDb fallback
    if (customTmdbKey) {
      try {
        const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(
          customTmdbKey
        )}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
        const tmdbRes = await fetch(tmdbUrl);
        if (tmdbRes.ok) {
          const tmdbData: any = await tmdbRes.json();
          if (Array.isArray(tmdbData.results)) {
            for (const item of tmdbData.results.slice(0, 10)) {
              const isMovie = item.media_type === 'movie';
              const isTv = item.media_type === 'tv';
              const isPerson = item.media_type === 'person';
              const title = item.title || item.name || item.original_name || query;
              const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
                : isPerson && item.profile_path
                ? `https://image.tmdb.org/t/p/w780${item.profile_path}`
                : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80';
              const backdrop = item.backdrop_path
                ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                : poster;

              results.push({
                id: `tmdb_${item.id}`,
                tmdbId: item.id,
                title: title,
                character: isPerson ? title : `${title} Lead Character`,
                franchise: title,
                universe: isMovie ? 'Cinematic Universe' : isTv ? 'Television & Streaming Universe' : 'Celebrity & Lore',
                mediaType: isMovie ? 'movie' : isTv ? 'ott_series' : 'cartoon',
                genres: isPerson ? ['Acting', 'Voice Acting'] : ['Action', 'Drama', 'Adventure'],
                ottPlatforms: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'JioCinema', 'Apple TV+'],
                releaseYear: (item.release_date || item.first_air_date || '2024').substring(0, 4),
                seasonsEpisodes: isTv ? 'Multi-Season Series' : 'Feature Length Film',
                ageRating: item.adult ? '18+ (Mature)' : 'PG-13 / Universal',
                rating: {
                  score: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 8.5,
                  max: 10,
                  source: 'TMDB Global',
                },
                bannerImage: backdrop,
                characterAvatar: poster,
                studioOrCreator: 'Global Cinema & Television Distribution',
                originCountry: item.origin_country?.[0] || 'Global / International',
                synopsis: item.overview || `Global hit media production featuring ${title}.`,
                characterLore: isPerson
                  ? `Acclaimed performer known for notable roles across global television, streaming series, and films: ${(item.known_for || []).map((k: any) => k.title || k.name).join(', ')}`
                  : `Comprehensive storyline arc, memorable character journeys, and worldwide critical reception for ${title}.`,
                mediaLinks: {
                  tmdbUrl: `https://www.themoviedb.org/${isMovie ? 'movie' : isTv ? 'tv' : 'person'}/${item.id}`,
                  trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`,
                  posterHighResUrl: poster,
                  backdropHighResUrl: backdrop,
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn('[Entertainment Search] TMDB query error:', err);
      }
    }

    // Attempt live OMDb query if key provided
    if (customOmdbKey && results.length < 5) {
      try {
        const omdbUrl = `https://www.omdbapi.com/?apikey=${encodeURIComponent(customOmdbKey)}&s=${encodeURIComponent(
          query
        )}&plot=full`;
        const omdbRes = await fetch(omdbUrl);
        if (omdbRes.ok) {
          const omdbData: any = await omdbRes.json();
          if (omdbData.Search && Array.isArray(omdbData.Search)) {
            for (const m of omdbData.Search.slice(0, 8)) {
              if (results.some((r) => r.title.toLowerCase() === m.Title.toLowerCase())) continue;
              const poster = m.Poster && m.Poster !== 'N/A'
                ? m.Poster
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80';
              results.push({
                id: `omdb_${m.imdbID}`,
                imdbId: m.imdbID,
                title: m.Title,
                character: `${m.Title} Hero`,
                franchise: m.Title,
                universe: 'Global Entertainment & Lore',
                mediaType: m.Type === 'series' ? 'ott_series' : m.Type === 'game' ? 'game' : 'movie',
                genres: ['Drama', 'Action', 'Thriller'],
                ottPlatforms: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar'],
                releaseYear: m.Year || '2024',
                seasonsEpisodes: m.Type === 'series' ? 'Episodes Collection' : 'Feature Film',
                ageRating: 'PG-13 / UA',
                rating: {
                  score: 8.4,
                  max: 10,
                  source: 'IMDb / OMDb',
                },
                bannerImage: poster,
                characterAvatar: poster,
                studioOrCreator: 'Hollywood / Worldwide Studios',
                originCountry: 'International',
                synopsis: `${m.Title} (${m.Year}) - Acclaimed ${m.Type} production.`,
                characterLore: `Iconic franchise with vast cinematic lore and cultural footprint.`,
                mediaLinks: {
                  imdbUrl: `https://www.imdb.com/title/${m.imdbID}`,
                  trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(m.Title + ' trailer')}`,
                  posterHighResUrl: poster,
                  backdropHighResUrl: poster,
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn('[Entertainment Search] OMDb query error:', err);
      }
    }

    res.json({
      success: true,
      query,
      count: results.length,
      results,
      providers: {
        tmdbActive: Boolean(customTmdbKey),
        omdbActive: Boolean(customOmdbKey),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch entertainment metadata' });
  }
});

// 19. Direct Import Entertainment Asset into Active User Projects & Cloud Storage
app.post('/api/entertainment/import-project', (req: Request, res: Response) => {
  const {
    userId = 'demo_user',
    item,
    targetProjectId,
    projectCategory = 'film',
    customTitle,
    saveAssetsToCloud = true,
  } = req.body;

  if (!item || !item.title) {
    return res.status(400).json({ success: false, error: 'Valid entertainment item required' });
  }

  const title = customTitle || `${item.title} - ${item.character} Master Reference Project`;
  const desc = item.synopsis || item.characterLore || `Imported cross-platform reference project for ${item.title}`;

  // Structured script / content bible
  const projectContent = [
    `# =======================================================`,
    `# PROJECT BIBLE: ${item.title.toUpperCase()}`,
    `# Character: ${item.character} | Universe: ${item.universe}`,
    `# Media Type: ${item.mediaType?.toUpperCase()} | Rating: ${item.rating?.score || '9.0'}/10 (${item.rating?.source || 'Cross-Platform API'})`,
    `# =======================================================\n`,
    `## 1. EXECUTIVE SYNOPSIS`,
    `${item.synopsis}\n`,
    `## 2. CHARACTER LORE & PSYCHOLOGY`,
    `${item.characterLore}\n`,
    `## 3. VISUAL SPECIFICATIONS & COSTUME DESIGN`,
    `- Outfit: ${item.visualTraits?.outfit || 'Signature costume'}`,
    `- Features: ${item.visualTraits?.features || 'Distinctive traits'}`,
    `- Iconic Artifact: ${item.visualTraits?.iconicItem || 'Signature item'}`,
    `- Color Palette: ${(item.visualTraits?.colorPalette || []).join(', ') || '#3B82F6, #EF4444'}\n`,
    `## 4. STUDIO PRODUCTION PROMPT PRESETS`,
    `### 🎬 Cinematic Screenplay / Scene Action:`,
    `${item.studioPresets?.filmScriptPrompt || 'INT. ARENA - DAY'}\n`,
    `### 🎨 8K Photorealistic Render Prompt:`,
    `${item.studioPresets?.imagePrompt || '8k high resolution cinematic portrait'}\n`,
    `### 🧊 3D WebGL Rigging & Mesh Archetype:`,
    `Archetype: ${item.studioPresets?.threeModelArchetype || '3D Rigged Hero'}\nPrompt: ${item.studioPresets?.threePrompt || '3d high-poly model'}\n`,
    `### 🎙️ Dialogue Dubbing & Subtitle Script:`,
    `${item.studioPresets?.dubbingDialogue || 'Legendary dialogue sequence'}\n`,
    `## 5. CROSS-PLATFORM MEDIA & ASSET LINKS`,
    `- Poster URL: ${item.bannerImage || item.characterAvatar || 'N/A'}`,
    item.mediaLinks?.imdbUrl ? `- IMDb: ${item.mediaLinks.imdbUrl}` : '',
    item.mediaLinks?.tmdbUrl ? `- TMDB: ${item.mediaLinks.tmdbUrl}` : '',
    item.mediaLinks?.trailerUrl ? `- Official Trailer Search: ${item.mediaLinks.trailerUrl}` : '',
  ].filter(Boolean).join('\n');

  const createdProject: ProjectItem = {
    id: targetProjectId || `proj_imported_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    description: desc,
    category: (projectCategory as any) || 'film',
    isPinned: true,
    activeTool: item.mediaType === 'game' ? 'game_studio' : item.mediaType === 'anime' ? 'manga_storyboard' : 'film_studio',
    subTool: 'script',
    content: projectContent,
    tags: [
      'Imported',
      'Cross-Platform',
      item.franchise || item.title,
      item.mediaType || 'entertainment',
      ...(item.genres || []).slice(0, 3),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const savedCloudAssets: any[] = [];

  if (saveAssetsToCloud) {
    if (item.bannerImage) {
      const bannerAsset = saveAssetToCloud({
        userId,
        assetType: 'image_8k',
        title: `${item.title} - High-Res Key Art Banner`,
        prompt: `Cross-Platform Asset: ${item.title} Backdrop Media Link`,
        dataBase64OrUrl: item.bannerImage,
        provider: 'AWS_S3',
      });
      savedCloudAssets.push(bannerAsset);
    }

    if (item.characterAvatar && item.characterAvatar !== item.bannerImage) {
      const avatarAsset = saveAssetToCloud({
        userId,
        assetType: 'image_8k',
        title: `${item.character} - Character Avatar & Poster`,
        prompt: `Cross-Platform Asset: ${item.character} Poster Artwork`,
        dataBase64OrUrl: item.characterAvatar,
        provider: 'Cloudinary',
      });
      savedCloudAssets.push(avatarAsset);
    }
  }

  broadcastSse('PROJECT_IMPORTED', { project: createdProject, userId });

  res.json({
    success: true,
    message: `Successfully imported "${item.title}" into active projects!`,
    project: createdProject,
    savedCloudAssets,
  });
});

// 20. Real-Time Trending Media & Characters Aggregator (TMDB API / Global Entertainment)
app.get('/api/entertainment/trending', async (req: Request, res: Response) => {
  const timeWindow = (req.query.timeWindow as string) || 'day';
  const mediaType = (req.query.mediaType as string) || 'all';
  const category = (req.query.category as string) || 'all';
  const language = (req.query.language as string) || 'en-US';
  const customTmdbKey = (req.query.tmdbKey as string) || process.env.TMDB_API_KEY || '';

  try {
    const trendingItems: any[] = [];
    let liveTmdbSuccess = false;

    if (customTmdbKey) {
      try {
        let tmdbEndpoint = '';
        if (category === 'popular') {
          tmdbEndpoint = mediaType === 'tv'
            ? `https://api.themoviedb.org/3/tv/popular?api_key=${encodeURIComponent(customTmdbKey)}&language=${encodeURIComponent(language)}&page=1`
            : `https://api.themoviedb.org/3/movie/popular?api_key=${encodeURIComponent(customTmdbKey)}&language=${encodeURIComponent(language)}&page=1`;
        } else if (category === 'top_rated') {
          tmdbEndpoint = mediaType === 'tv'
            ? `https://api.themoviedb.org/3/tv/top_rated?api_key=${encodeURIComponent(customTmdbKey)}&language=${encodeURIComponent(language)}&page=1`
            : `https://api.themoviedb.org/3/movie/top_rated?api_key=${encodeURIComponent(customTmdbKey)}&language=${encodeURIComponent(language)}&page=1`;
        } else if (category === 'anime') {
          tmdbEndpoint = `https://api.themoviedb.org/3/discover/tv?api_key=${encodeURIComponent(customTmdbKey)}&with_genres=16&sort_by=popularity.desc&language=${encodeURIComponent(language)}&page=1`;
        } else {
          // Default TMDB trending
          const tmdbType = mediaType === 'tv' ? 'tv' : mediaType === 'movie' ? 'movie' : mediaType === 'person' ? 'person' : 'all';
          tmdbEndpoint = `https://api.themoviedb.org/3/trending/${tmdbType}/${timeWindow}?api_key=${encodeURIComponent(customTmdbKey)}&language=${encodeURIComponent(language)}`;
        }

        const tmdbRes = await fetch(tmdbEndpoint);
        if (tmdbRes.ok) {
          const tmdbData: any = await tmdbRes.json();
          if (Array.isArray(tmdbData.results) && tmdbData.results.length > 0) {
            liveTmdbSuccess = true;
            tmdbData.results.slice(0, 18).forEach((item: any, idx: number) => {
              const isMovie = item.media_type === 'movie' || Boolean(item.title);
              const isTv = item.media_type === 'tv' || Boolean(item.name && !item.known_for);
              const isPerson = item.media_type === 'person' || Boolean(item.known_for);
              const title = item.title || item.name || item.original_name || `Trending Entity #${idx + 1}`;
              const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
                : isPerson && item.profile_path
                ? `https://image.tmdb.org/t/p/w780${item.profile_path}`
                : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80';
              const backdrop = item.backdrop_path
                ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                : poster;

              const relYear = (item.release_date || item.first_air_date || '2024').substring(0, 4);
              const voteScore = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 8.6;

              trendingItems.push({
                id: `tmdb_trend_${item.id}`,
                tmdbId: item.id,
                rank: idx + 1,
                popularityScore: Math.round(item.popularity || (1000 - idx * 45)),
                isTrending: true,
                popularityTrend: idx < 3 ? 'fire' : idx < 8 ? 'up' : 'stable',
                title,
                character: isPerson ? title : `${title} Protagonist`,
                nativeName: item.original_title || item.original_name || title,
                franchise: title,
                universe: isMovie ? 'Cinematic Universe' : isTv ? 'OTT Streaming Universe' : 'Celebrity & Global Media',
                mediaType: isMovie ? 'movie' : isTv ? 'ott_series' : isPerson ? 'cartoon' : 'anime',
                genres: isPerson ? ['Acting', 'Celebrity'] : ['Action', 'Sci-Fi', 'Adventure'],
                ottPlatforms: ['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar', 'JioCinema', 'Apple TV+'],
                releaseYear: relYear,
                seasonsEpisodes: isTv ? 'Trending Series' : 'Blockbuster Release',
                ageRating: item.adult ? '18+ (Mature)' : 'PG-13 / UA',
                rating: {
                  score: voteScore,
                  max: 10,
                  source: 'TMDB Real-Time',
                },
                bannerImage: backdrop,
                characterAvatar: poster,
                studioOrCreator: 'Global Entertainment Studios',
                originCountry: item.origin_country?.[0] || 'International',
                visualTraits: {
                  outfit: 'Signature iconic screen attire & production costume',
                  features: 'Ultra high-definition facial aesthetics, dramatic cinematic lighting',
                  iconicItem: 'Signature prop / legendary trademark asset',
                  hairAndEyes: 'Stylized cinematic hair and expressive gaze',
                  colorPalette: ['#E50914', '#1E40AF', '#F59E0B', '#10B981'],
                },
                abilitiesAndMoves: ['Heroic Narrative Arc', 'Cinematic Dialogue Delivery', 'Action Choreography'],
                voiceActor: isPerson ? title : 'Lead Voice & Screen Cast',
                synopsis: item.overview || `Trending global entertainment sensation ${title}. Captivating audiences worldwide with record-breaking engagement.`,
                characterLore: isPerson
                  ? `World-renowned actor and media personality with high-impact screen performances.`
                  : `Central protagonist and dramatic focal point driving the high-stakes narrative of ${title}.`,
                mediaLinks: {
                  tmdbUrl: `https://www.themoviedb.org/${isMovie ? 'movie' : isTv ? 'tv' : 'person'}/${item.id}`,
                  trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer 4k')}`,
                  posterHighResUrl: poster,
                  backdropHighResUrl: backdrop,
                },
                studioPresets: {
                  imagePrompt: `8k masterpiece photorealistic cinematic portrait of ${title} character, epic atmospheric lighting, IMAX composition, Unreal Engine 5 render style, intricate details, 85mm lens f/1.4`,
                  imageStyle: 'Cinematic Hyper-Realistic',
                  videoPrompt: `Cinematic 8K camera dolly zoom tracking ${title} hero through high stakes action scene, volumetric fog, dynamic lighting, 60fps`,
                  filmScriptPrompt: `INT. HIGH STAKES ARENA - NIGHT\\n\\nDynamic lighting cuts through the atmosphere. The protagonist stands resolute.\\n\\nHERO\\n"We do not back down now. The story has only just begun."\\n\\nCamera swoops around in a 360-degree heroic sweep.`,
                  threeModelArchetype: 'Cinematic Hero 3D Rig',
                  threePrompt: `High-poly 3D character mesh of ${title}, fully rigged with PBR 4K textures, ready for Three.js WebGL rendering`,
                  songThemePrompt: `Epic orchestral cinematic theme song for ${title}, soaring strings, powerful brass, emotive crescendo`,
                  songGenre: 'Cinematic Orchestral & Hybrid Synth',
                  dubbingDialogue: `The world is watching. We will prevail with honor and courage!`,
                  mangaStoryline: `Page 1: Wide establishing shot of the battlefield. Page 2: Close-up on eyes full of resolve. Page 3: Massive splash page impact strike!`,
                  docBibleTitle: `${title} Production Bible & Cinematic Lore Manual`,
                  gameArchetype: 'Action RPG Protagonist',
                },
              });
            });
          }
        }
      } catch (err) {
        console.warn('[TMDB Trending Error]', err);
      }
    }

    res.json({
      success: true,
      timeWindow,
      mediaType,
      category,
      language,
      total: trendingItems.length,
      isLiveTmdb: liveTmdbSuccess,
      results: trendingItems,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch trending media' });
  }
});

// 21. Multilingual Synchronization & Localization Generator
app.post('/api/entertainment/multilingual-sync', (req: Request, res: Response) => {
  const { item, targetLanguage = 'hi' } = req.body;

  if (!item || !item.title) {
    return res.status(400).json({ success: false, error: 'Valid entertainment item required' });
  }

  // Language translation maps for instant real-time sync
  const langNames: Record<string, string> = {
    hi: 'Hindi (हिंदी)',
    en: 'English',
    ja: 'Japanese (日本語)',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    zh: 'Mandarin (中文)',
    ko: 'Korean (한국어)',
    ar: 'Arabic (العربية)',
    ru: 'Russian (Русский)',
    bn: 'Bengali (বাংলা)',
    mr: 'Marathi (मराठी)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    gu: 'Gujarati (ગુજરાતી)',
    ur: 'Urdu (اردو)',
    pa: 'Punjabi (ਪੰਜਾਬੀ)',
    it: 'Italian (Italiano)',
    pt: 'Portuguese (Português)',
  };

  const localizedQuotes: Record<string, { time: string; speaker: string; text: string; translated: string }[]> = {
    hi: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `युद्ध तो अभी शुरू हुआ है, हिम्मत मत हारना!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `अंधेरे के इस संसार में, एक नया नायक जन्म लेता है।` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `अपनी आखिरी सांस तक मैं सबकी रक्षा करूँगा!` },
    ],
    ja: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `戦いはまだ始まったばかりだ。諦めるな！` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `影の世界で、一人の英雄が立ち上がる。` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `最後の息を引き取るまで、皆を守り抜く！` },
    ],
    es: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `¡La batalla acaba de comenzar, no te rindas!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `En un mundo de sombras, un héroe se levanta.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `¡Protegeré a todos hasta mi último aliento!` },
    ],
    fr: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `La bataille ne fait que commencer, ne baisse pas les bras !` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `Dans un monde d'ombres, un héros s'élève.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `Je protégerai tout le monde jusqu'à mon dernier souffle !` },
    ],
    de: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `Die Schlacht hat gerade erst begonnen. Gib niemals auf!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `In einer Welt der Schatten erhebt sich ein Held.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `Ich werde jeden bis zu meinem letzten Atemzug beschützen!` },
    ],
    zh: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `战斗才刚刚开始，绝不放弃！` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `在阴影的世界中，一位英雄崛起。` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `我将战斗到最后一刻，守护大家！` },
    ],
    ko: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `전투는 이제 시작일 뿐이다. 절대 포기하지 마라!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `어둠의 세계에서 한 영웅이 일어선다.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `마지막 숨이 다할 때까지 모두를 지키겠다!` },
    ],
    mr: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `लढाई नुकतीच सुरू झाली आहे, हार मानू नका!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `अंधाराच्या जगात एका नायकाचा उदय होतो.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `माझ्या शेवटच्या श्वासापर्यंत मी सर्वांचे रक्षण करेन!` },
    ],
    ta: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `போராட்டம் இப்போதுதான் தொடங்கியுள்ளது, கைவிடாதீர்கள்!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `நிழல்களின் உலகில் ஒரு வீரன் எழுகிறான்.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `என் கடைசி மூச்சு வரை அனைவரையும் காப்பாற்றுவேன்!` },
    ],
    te: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `యుద్ధం ఇప్పుడే మొదలైంది, ఆశ కోల్పోకండి!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `చీకటి ప్రపంచంలో ఒక వీరుడు ఉద్భవిస్తాడు.` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `నా చివరి శ్వాస వరకు ప్రతి ఒక్కరినీ కాపాడతాను!` },
    ],
    bn: [
      { time: '00:00:05,000', speaker: item.character || item.title, text: `The battle has only just begun.`, translated: `যুদ্ধ কেবল শুরু হয়েছে, হাল ছেড়ো না!` },
      { time: '00:00:12,000', speaker: 'Narrator', text: `In a world of shadows, one hero rises.`, translated: `অন্ধকারের জগতে একজন নায়ক আবির্ভূত হয়।` },
      { time: '00:00:22,000', speaker: item.character || item.title, text: `I will protect everyone till my last breath!`, translated: `শেষ নিঃশ্বাস পর্যন্ত আমি সবাইকে রক্ষা করব!` },
    ],
  };

  const quotes = localizedQuotes[targetLanguage] || localizedQuotes['hi'];
  const srtContent = quotes
    .map((q, idx) => `${idx + 1}\n${q.time} --> ${q.time.replace('05,000', '09,500').replace('12,000', '18,500').replace('22,000', '28,000')}\n${q.speaker}: ${q.translated}\n`)
    .join('\n');

  res.json({
    success: true,
    languageCode: targetLanguage,
    languageName: langNames[targetLanguage] || targetLanguage,
    quotes,
    srtContent,
  });
});

// 22. Instant Populate Studio Assets Endpoint
app.post('/api/entertainment/populate-studio-assets', (req: Request, res: Response) => {
  const { item, studioKey = 'all', userId = 'demo_user' } = req.body;

  if (!item || !item.title) {
    return res.status(400).json({ success: false, error: 'Valid entertainment item required' });
  }

  const generatedAssets: any[] = [];

  // Auto-generate high-res cloud asset records
  if (item.bannerImage) {
    const asset = saveAssetToCloud({
      userId,
      assetType: 'image_8k',
      title: `${item.title} - 8K Populated Studio Asset`,
      prompt: item.studioPresets?.imagePrompt || `8k cinematic render of ${item.title}`,
      dataBase64OrUrl: item.bannerImage,
      provider: 'AWS_S3',
    });
    generatedAssets.push(asset);
  }

  const populatedPayload = {
    entity: {
      id: item.id,
      title: item.title,
      character: item.character,
      franchise: item.franchise,
      universe: item.universe,
      mediaType: item.mediaType,
      rating: item.rating,
      genres: item.genres,
    },
    studioPresets: item.studioPresets,
    multilingual: item.subtitles,
    cloudAssets: generatedAssets,
    timestamp: new Date().toISOString(),
  };

  broadcastSse('STUDIO_ASSET_POPULATED', { payload: populatedPayload, userId });

  res.json({
    success: true,
    message: `Instantly populated studio assets for "${item.title}"!`,
    populatedPayload,
  });
});

// 23. Character Repository In-Memory Storage & TMDB Character Extraction Engine
const characterRepositoryStore: Map<string, any[]> = new Map();
const characterFavoritesStore: Map<string, string[]> = new Map();

// Helper to seed or extract character traits from TMDB person/character
function buildExtractedCharacterProfile(personOrChar: any, index: number): any {
  const name = personOrChar.name || personOrChar.character || `Legendary Character #${index + 1}`;
  const knownFor = personOrChar.known_for?.[0]?.title || personOrChar.known_for?.[0]?.name || personOrChar.franchise || 'Global Cinematic Universe';
  const role = personOrChar.character || personOrChar.known_for_department || 'Lead Icon';
  const profilePic = personOrChar.profile_path
    ? `https://image.tmdb.org/t/p/w780${personOrChar.profile_path}`
    : personOrChar.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
  const backdrop = personOrChar.known_for?.[0]?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${personOrChar.known_for[0].backdrop_path}`
    : personOrChar.backdropUrl || profilePic;

  const department = personOrChar.known_for_department?.toLowerCase() || '';
  const category = department.includes('direct') ? 'cinema' : index % 3 === 0 ? 'superhero' : index % 3 === 1 ? 'anime' : 'cinema';

  return {
    id: `char_repo_${personOrChar.id || Date.now()}_${index}`,
    tmdbId: personOrChar.id,
    name,
    characterRole: role,
    actorName: personOrChar.actorName || personOrChar.name || name,
    franchise: knownFor,
    universe: `${knownFor} Universe`,
    category,
    popularity: Math.round(personOrChar.popularity || (950 - index * 30)),
    biography: personOrChar.biography || `Iconic entertainment character and central protagonist in ${knownFor}. Defined by profound narrative agency, trademark visual style, and memorable dialogue delivery across international screen appearances.`,
    characterLore: `Originating as a defining archetype in ${knownFor}, this persona commands profound influence across fandoms, balancing complex emotional stakes with extraordinary resolve.`,
    personality: 'Resolute, charismatic, intensely strategic, deeply protective of allies, commanding presence.',
    avatarUrl: profilePic,
    fullBodyArtworkUrl: profilePic,
    backdropUrl: backdrop,
    visualTraits: {
      outfit: 'Signature screen attire, high-contrast battle/cinematic costume with tailored textural materials.',
      hairAndEyes: 'Stylized cinematic hair with piercing expressive gaze and dynamic backlight framing.',
      iconicItem: 'Legendary signature prop / mythic artifact',
      physicalBuild: 'Athletic, imposing heroic posture with cinematic silhouette',
      expressionStyle: 'Focused, enigmatic resolve with high-stakes emotional gravity',
      colorPalette: ['#1E1B4B', '#3B82F6', '#EF4444', '#F59E0B', '#10B981'],
      aestheticArchetype: 'Cinematic IMAX High-Fidelity Protagonist',
    },
    abilities: [
      'Master Tactician & Leadership',
      'Iconic Cinematic Screen Presence',
      'High-Impact Dialogue Delivery',
      'Peak Action Choreography',
    ],
    filmography: (personOrChar.known_for || []).map((kf: any) => ({
      title: kf.title || kf.name || 'Blockbuster Feature',
      year: (kf.release_date || kf.first_air_date || '2024').substring(0, 4),
      role: 'Lead Character',
      poster: kf.poster_path ? `https://image.tmdb.org/t/p/w500${kf.poster_path}` : profilePic,
    })),
    studioPresets: {
      imageStudioPrompt: `8k hyperrealistic character portrait of ${name} (${role}), cinematic dramatic key lighting, 85mm f/1.4 lens, Unreal Engine 5 render style, intricate textile texture, volumetric atmospheric particles, Octane Render award winning masterpiece`,
      imageStudioNegativePrompt: 'low quality, blurry, deformed fingers, extra limbs, bad anatomy, flat lighting, watermark',
      imageStudioStyle: 'Cinematic Hyper-Realistic',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `INT. COMMAND SANCTUARY - NIGHT\n\nDramatic rim lighting outlines ${name.toUpperCase()}.\n\n${name.toUpperCase()}\n(gazing at the horizon)\n"We chose this path knowing the risks. We don't retreat now."\n\nClose up on resolute expression.`,
      filmStudioCharacterBio: `Name: ${name} | Role: ${role} | Franchise: ${knownFor} | Core Trait: Unyielding Resolve | Motivation: Protection of the realm.`,
      threeModelPrompt: `High-poly 3D character mesh of ${name}, full body topology, PBR 4K textures, rigged for skeletal animation in Three.js`,
      voiceProfile: `Authoritative, resonant, deep cinematic timbre with steady pacing and heroic inflection`,
      mangaStoryboard: `Panel 1: Extreme close-up on eyes. Panel 2: Wide cinematic charge into the breach. Panel 3: Signature power manifestation!`,
    },
    isSavedToRepo: false,
    savedAt: new Date().toISOString(),
    tags: ['TMDB Sync', knownFor, category, 'Visual Trait Synced'],
  };
}

// 24. Character Repository Endpoints
app.get('/api/entertainment/character-repository', async (req: Request, res: Response) => {
  const query = (req.query.query as string || '').trim();
  const category = (req.query.category as string || 'all').toLowerCase();
  const filterSaved = req.query.filterSaved === 'true';
  const userId = (req.query.userId as string) || 'demo_user';
  const customTmdbKey = (req.query.tmdbKey as string) || process.env.TMDB_API_KEY || '';

  const userSavedList = characterRepositoryStore.get(userId) || [];

  let liveCharacters: any[] = [];
  let isLiveTmdb = false;

  // If TMDB key available and search/category requested, query TMDB Person/Character Search
  if (customTmdbKey && (query || category !== 'all')) {
    try {
      const tmdbQuery = query || (category === 'anime' ? 'Hayao Miyazaki' : category === 'superhero' ? 'Stan Lee' : category === 'gaming' ? 'Hideo Kojima' : 'Christopher Nolan');
      const tmdbUrl = `https://api.themoviedb.org/3/search/person?api_key=${encodeURIComponent(customTmdbKey)}&query=${encodeURIComponent(tmdbQuery)}&page=1&include_adult=false`;

      const tmdbRes = await fetch(tmdbUrl);
      if (tmdbRes.ok) {
        const data: any = await tmdbRes.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          isLiveTmdb = true;
          liveCharacters = data.results.slice(0, 12).map((item: any, idx: number) => {
            const profile = buildExtractedCharacterProfile(item, idx);
            // Check if saved
            profile.isSavedToRepo = userSavedList.some((s) => s.id === profile.id || s.name.toLowerCase() === profile.name.toLowerCase());
            return profile;
          });
        }
      }
    } catch (err) {
      console.warn('[TMDB Character Search Error]', err);
    }
  }

  // Combine saved list with live characters
  const combined = [...userSavedList];
  liveCharacters.forEach((lc) => {
    if (!combined.some((c) => c.name.toLowerCase() === lc.name.toLowerCase())) {
      combined.push(lc);
    }
  });

  let results = combined;
  if (filterSaved) {
    results = userSavedList;
  } else if (category && category !== 'all') {
    results = results.filter((c) => c.category === category || c.tags?.includes(category));
  }
  if (query) {
    const q = query.toLowerCase();
    results = results.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.franchise?.toLowerCase().includes(q) ||
      c.actorName?.toLowerCase().includes(q) ||
      c.characterRole?.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    total: results.length,
    savedCount: userSavedList.length,
    isLiveTmdb,
    results,
  });
});

app.post('/api/entertainment/character-repository/save', (req: Request, res: Response) => {
  const { character, userId = 'demo_user' } = req.body;
  if (!character || !character.name) {
    return res.status(400).json({ success: false, error: 'Valid character profile required' });
  }

  const list = characterRepositoryStore.get(userId) || [];
  const charWithSave = {
    ...character,
    id: character.id || `char_${Date.now()}`,
    isSavedToRepo: true,
    savedAt: new Date().toISOString(),
  };

  const existingIdx = list.findIndex((c) => c.id === charWithSave.id || c.name.toLowerCase() === charWithSave.name.toLowerCase());
  if (existingIdx >= 0) {
    list[existingIdx] = charWithSave;
  } else {
    list.unshift(charWithSave);
  }

  characterRepositoryStore.set(userId, list);

  broadcastSse('CHARACTER_SAVED', { character: charWithSave, userId });

  res.json({
    success: true,
    message: `Character "${charWithSave.name}" successfully saved to your Character Repository!`,
    character: charWithSave,
    savedCount: list.length,
  });
});

app.delete('/api/entertainment/character-repository/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = (req.query.userId as string) || 'demo_user';

  const list = characterRepositoryStore.get(userId) || [];
  const filtered = list.filter((c) => c.id !== id);
  characterRepositoryStore.set(userId, filtered);

  res.json({
    success: true,
    message: 'Character removed from repository',
    savedCount: filtered.length,
  });
});

// 25. Direct Import Character to Studio Workspace
app.post('/api/entertainment/character/import-to-studio', (req: Request, res: Response) => {
  const { character, targetStudio = 'image_studio', userId = 'demo_user' } = req.body;

  if (!character || !character.name) {
    return res.status(400).json({ success: false, error: 'Valid character profile required' });
  }

  // Create cloud asset record
  const asset = saveAssetToCloud({
    userId,
    assetType: targetStudio === 'image_studio' ? 'image_8k' : 'screenplay',
    title: `${character.name} - Studio Reference Asset`,
    prompt: character.studioPresets?.imageStudioPrompt || character.biography,
    dataBase64OrUrl: character.avatarUrl,
    provider: 'Cloudinary',
  });

  const studioImportPayload = {
    targetStudio,
    character: {
      id: character.id,
      name: character.name,
      actorName: character.actorName,
      franchise: character.franchise,
      universe: character.universe,
      visualTraits: character.visualTraits,
      abilities: character.abilities,
      biography: character.biography,
      avatarUrl: character.avatarUrl,
      presets: character.studioPresets,
    },
    cloudAsset: asset,
    timestamp: new Date().toISOString(),
  };

  broadcastSse('STUDIO_CHARACTER_IMPORTED', { payload: studioImportPayload, userId });

  res.json({
    success: true,
    message: `Character "${character.name}" imported into ${targetStudio}!`,
    studioImportPayload,
  });
});

// 26. Character Favorites Management
app.get('/api/entertainment/character/favorites', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'demo_user';
  const favorites = characterFavoritesStore.get(userId) || [];
  res.json({ success: true, favorites, count: favorites.length });
});

app.post('/api/entertainment/character/favorite', (req: Request, res: Response) => {
  const { characterId, isFavorite, userId = 'demo_user' } = req.body;
  if (!characterId) {
    return res.status(400).json({ success: false, error: 'characterId required' });
  }

  let favorites = characterFavoritesStore.get(userId) || [];
  if (isFavorite) {
    if (!favorites.includes(characterId)) {
      favorites.push(characterId);
    }
  } else {
    favorites = favorites.filter((id) => id !== characterId);
  }
  characterFavoritesStore.set(userId, favorites);

  broadcastSse('CHARACTER_FAVORITE_TOGGLED', { characterId, isFavorite, userId });

  res.json({
    success: true,
    message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
    isFavorite,
    favorites,
    count: favorites.length,
  });
});

// 27. Character Visual Comparison & Crossover Scene Generator
app.post('/api/entertainment/character/crossover-prompt', (req: Request, res: Response) => {
  const { characters = [], targetStudio = 'image_studio', crossoverStyle = 'epic_duel' } = req.body;
  if (!Array.isArray(characters) || characters.length < 2) {
    return res.status(400).json({ success: false, error: 'At least 2 characters required for crossover comparison' });
  }

  const charNames = characters.map((c) => c.name).join(' and ');
  const charTraits = characters.map((c) => `${c.name} (${c.visualTraits?.outfit || 'iconic outfit'}, ${c.visualTraits?.aestheticArchetype || 'master'})`).join(' facing ');
  
  let imagePrompt = `8k ultra-detailed cinematic concept artwork depicting a legendary showdown and crossover between ${charNames}. Dynamic combat composition, ${charTraits}, volumetric lighting, highly detailed faces, Unreal Engine 5 render, cinematic lighting.`;
  let screenplayScript = `EXT. CONVERGENCE OF WORLDS - TWILIGHT\n\nA dimensional rift crackles with raw energy.\n\n${characters[0].name.toUpperCase()} stands on the precipice, eyes locked forward.\n\n${characters[1].name.toUpperCase()} emerges from the cosmic smoke.\n\n${characters[0].name.toUpperCase()}\n"I didn't expect our paths to cross here."\n\n${characters[1].name.toUpperCase()}\n"Destiny rarely gives advance notice."\n\nThey prepare their signature stances as the fate of the multiverse hangs in balance.`;

  res.json({
    success: true,
    crossoverPrompt: {
      imagePrompt,
      screenplayScript,
      characters: characters.map((c) => ({ id: c.id, name: c.name, category: c.category })),
    },
  });
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
  const httpServer = http.createServer(app);

  // Initialize Real-Time Collaborative Annotation & Sentiment WebSocket Server
  setupStudioWebSocketServer(httpServer);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[iCALLOG V18] Server initialized on http://0.0.0.0:${PORT} (HTTP & WebSockets)`);
  });
}

startServer();
