import { describe, it, expect, vi } from 'vitest';
import * as fn from '../netlify/functions/supabase-auth-exchange';

vi.mock('../netlify/functions/_utils/auth', () => ({ verifySession: vi.fn(() => ({ address: '0xabc' })), corsHeaders: () => ({}), securityHeaders: () => ({}) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  auth: { admin: { createUser: async () => ({ data: null, error: null }) } },
  rpc: async (name: string, params: any) => { throw new Error('rpc not found'); },
  from: (table: string) => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'uuid-abc', wallet_address: '0xabc' } }) }) }) })
}) }));

describe('supabase-auth-exchange', () => {
  it('returns user row when RPC unavailable', async () => {
    const res = await (fn as any).handler({ httpMethod: 'GET', headers: {} });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.id).toBe('uuid-abc');
    expect(body.note).toContain('No client token issued');
  });
});
