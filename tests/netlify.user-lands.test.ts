import { describe, it, expect, vi } from 'vitest';
import * as userLandsFn from '../netlify/functions/user-lands';

// Scenario 1: verifySession returns a valid address and supabase returns no lands (should create default or fallback)
vi.mock('../netlify/functions/_utils/auth', () => ({
  verifySession: vi.fn(() => ({ address: '0xabc' })),
  corsHeaders: () => ({}),
  securityHeaders: () => ({}),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'lands') return { select: () => ({ eq: () => ({ order: () => ({ catch: async () => ({ data: [] }) }) }) }) };
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) };
    }
  })
}));

describe('user-lands function', () => {
  it('returns lands list (creates default) when supabase available', async () => {
    const evt: any = { httpMethod: 'GET', headers: {} };
    const res = await (userLandsFn as any).handler(evt);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.lands).toBeDefined();
    expect(Array.isArray(body.lands)).toBe(true);
  });

  it('returns 401 when session missing', async () => {
    // Reset modules and re-mock verifySession to return null for this test
    vi.resetModules();
    vi.doMock('../netlify/functions/_utils/auth', () => ({
      verifySession: () => null,
      corsHeaders: () => ({}),
      securityHeaders: () => ({}),
    }));
    // Re-import the function to pick up new mock
    const fn = await import('../netlify/functions/user-lands');
    const evt: any = { httpMethod: 'GET', headers: {} };
    const res = await (fn as any).handler(evt);
    expect(res.statusCode).toBe(401);
  });
});