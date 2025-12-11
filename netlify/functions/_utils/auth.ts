import jwt from "jsonwebtoken";

export interface SessionPayload {
  address: string;
}

export function verifySession(cookieHeader: string | undefined): SessionPayload | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/treefi_session=([^;\s]+)/);
  if (!match) return null;
  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET!) as SessionPayload;
    if (!decoded.address) return null;
    return { address: (decoded.address || '').toLowerCase() };
  } catch (e) {
    return null;
  }
}

export function corsHeaders() {
  const origin = process.env.APP_DOMAIN || 'http://localhost:5173';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function securityHeaders() {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}
