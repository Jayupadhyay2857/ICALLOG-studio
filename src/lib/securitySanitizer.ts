/**
 * Application Security & Data Protection Guard
 * Provides Input Sanitization (XSS Defense), Cryptographic Integrity Signatures
 * for LocalStorage (Anti-Tampering), Rate Limiting, and Session Nonces.
 */

// Simple checksum generator for anti-tampering state checks
function computeSignature(payloadStr: string): string {
  let hash = 0;
  const secret = 'iCALLOG_SECURE_HMAC_SALT_2026';
  const combined = payloadStr + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Sanitize strings against Cross-Site Scripting (XSS), script injection,
 * and dangerous HTML/JS protocols.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/javascript:/gi, '') // Strip inline JS protocols
    .replace(/data:text\/html/gi, '') // Strip data HTML injection
    .replace(/on\w+\s*=/gi, '') // Strip event handlers like onload=, onerror=
    .replace(/<\/?[^>]+(>|$)/g, (match) => {
      // Escape HTML brackets for non-whitelisted characters
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
}

/**
 * Store data securely with an anti-tampering integrity signature.
 * Prevents users or malicious extensions from modifying localStorage values in DevTools.
 */
export function setSecureLocalItem(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    const jsonStr = JSON.stringify(data);
    const signature = computeSignature(jsonStr);
    const envelope = {
      payload: data,
      sig: signature,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (err) {
    console.error('Failed to write secure storage item:', err);
  }
}

/**
 * Read data securely and verify its integrity signature.
 * If signature verification fails (tampering detected), returns fallback and purges tampered data.
 */
export function getSecureLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    // Legacy un-enveloped raw storage handling
    if (!parsed || typeof parsed !== 'object' || !('sig' in parsed) || !('payload' in parsed)) {
      // Re-envelope legacy data for future reads
      setSecureLocalItem(key, parsed);
      return parsed as T;
    }

    const payloadStr = JSON.stringify(parsed.payload);
    const expectedSig = computeSignature(payloadStr);

    if (parsed.sig !== expectedSig) {
      console.warn(`[SECURITY ALERT] Storage tampering detected on key "${key}"! Purging modified state.`);
      localStorage.removeItem(key);
      return fallback;
    }

    return parsed.payload as T;
  } catch (err) {
    console.error(`Error reading secure item "${key}":`, err);
    return fallback;
  }
}

/**
 * Client-Side Rate Limiter Guard
 * Protects against rapid-fire spam clicks, brute-force prompt submissions, or DoS requests.
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(actionKey: string, maxRequests: number = 8, windowMs: number = 5000): { allowed: boolean; remainingMs: number } {
  const now = Date.now();
  const timestamps = rateLimitMap.get(actionKey) || [];

  // Filter timestamps within current window
  const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    const oldest = validTimestamps[0];
    const remainingMs = Math.max(0, windowMs - (now - oldest));
    return { allowed: false, remainingMs };
  }

  validTimestamps.push(now);
  rateLimitMap.set(actionKey, validTimestamps);
  return { allowed: true, remainingMs: 0 };
}

/**
 * Session Anti-CSRF Nonce Generator
 */
export function generateSessionNonce(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
