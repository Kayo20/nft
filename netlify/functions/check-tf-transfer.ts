import { Handler } from "@netlify/functions";
import { JsonRpcProvider, Interface } from 'ethers';
import { corsHeaders, securityHeaders, verifySession } from './_utils/auth';

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    if (!session) return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };

    const rpc = process.env.BNB_RPC_URL || process.env.RPC_URL || process.env.ALCHEMY_URL;
    if (!rpc) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'RPC not configured' }) };

    const provider = new JsonRpcProvider(rpc);
    const { TF_TOKEN_CONTRACT, GAME_WALLET } = await import('../../src/lib/constants');

    const userAddr = (session.address || '').toLowerCase();
    const gameAddr = (GAME_WALLET || '').toLowerCase();
    const tokenAddr = (TF_TOKEN_CONTRACT || '').toLowerCase();

    if (!tokenAddr) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'TF token contract not configured' }) };

    // Candidate function signatures to probe
    const functionFragments = [
      'function paused() view returns (bool)',
      'function isPaused() view returns (bool)',
      'function blacklist(address) view returns (bool)',
      'function isBlacklisted(address) view returns (bool)',
      'function isRestricted(address) view returns (bool)',
      'function isWhitelisted(address) view returns (bool)',
      'function whitelist(address) view returns (bool)',
      'function frozen(address) view returns (bool)',
      'function restricted(address) view returns (bool)'
    ];

    const iface = new Interface(functionFragments);

    const checks: any = { ok: true, token: tokenAddr, checks: {} };

    // helper to probe a named function
    const probeNoArg = async (name: string) => {
      try {
        const data = iface.encodeFunctionData(name, []);
        const res = await provider.call({ to: tokenAddr, data });
        const decoded = iface.decodeFunctionResult(name, res);
        return decoded && decoded.length ? Boolean(decoded[0]) : null;
      } catch (e) {
        return null;
      }
    };

    const probeAddrArg = async (name: string, addr: string) => {
      try {
        const data = iface.encodeFunctionData(name, [addr]);
        const res = await provider.call({ to: tokenAddr, data });
        const decoded = iface.decodeFunctionResult(name, res);
        return decoded && decoded.length ? Boolean(decoded[0]) : null;
      } catch (e) {
        return null;
      }
    };

    // Global paused?
    checks.checks.paused = (await probeNoArg('paused')) ?? (await probeNoArg('isPaused')) ?? null;

    // User-level checks
    checks.checks.userBlacklisted = (await probeAddrArg('isBlacklisted', userAddr)) ?? (await probeAddrArg('blacklist', userAddr)) ?? (await probeAddrArg('frozen', userAddr)) ?? null;
    checks.checks.userRestricted = (await probeAddrArg('isRestricted', userAddr)) ?? null;
    checks.checks.userWhitelisted = (await probeAddrArg('isWhitelisted', userAddr)) ?? (await probeAddrArg('whitelist', userAddr)) ?? null;

    // Game wallet checks
    checks.checks.gameBlacklisted = (await probeAddrArg('isBlacklisted', gameAddr)) ?? (await probeAddrArg('blacklist', gameAddr)) ?? (await probeAddrArg('frozen', gameAddr)) ?? null;
    checks.checks.gameRestricted = (await probeAddrArg('isRestricted', gameAddr)) ?? null;
    checks.checks.gameWhitelisted = (await probeAddrArg('isWhitelisted', gameAddr)) ?? (await probeAddrArg('whitelist', gameAddr)) ?? null;

    return { statusCode: 200, headers, body: JSON.stringify(checks) };
  } catch (err: any) {
    console.error('check-tf-transfer error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
