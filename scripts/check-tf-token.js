/*
  Usage: node scripts/check-tf-token.js [tokenAddress]
  Requires: RPC_URL environment variable

  Prints token status checks: paused, isRestricted/blacklisted, owner (if present)
*/

const { ethers } = require('ethers');

async function main() {
  const rpc = process.env.RPC_URL || process.env.BNB_RPC_URL || process.env.ALCHEMY_URL;
  if (!rpc) return console.error('RPC_URL (or BNB_RPC_URL/ALCHEMY_URL) is required');

  const tokenAddr = (process.argv[2] || '').trim();
  if (!tokenAddr) return console.error('Usage: node scripts/check-tf-token.js <tokenAddress>');

  const provider = new ethers.providers.JsonRpcProvider(rpc);

  // Candidate function fragments to probe
  const fragments = [
    'function paused() view returns (bool)',
    'function isPaused() view returns (bool)',
    'function isRestricted(address) view returns (bool)',
    'function isBlacklisted(address) view returns (bool)',
    'function isWhitelisted(address) view returns (bool)',
    'function blacklist(address) view returns (bool)',
    'function whitelist(address) view returns (bool)',
    'function frozen(address) view returns (bool)',
    'function owner() view returns (address)',
    'function controller() view returns (address)',
    'function l() view returns (address)',
    'function mode() view returns (uint256)'
  ];

  const iface = new ethers.utils.Interface(fragments);

  async function probeNoArg(name) {
    try {
      const data = iface.encodeFunctionData(name, []);
      const res = await provider.call({ to: tokenAddr, data });
      const decoded = iface.decodeFunctionResult(name, res);
      return decoded && decoded.length ? decoded[0] : null;
    } catch (e) {
      return null;
    }
  }

  async function probeAddrArg(name, addr) {
    try {
      const data = iface.encodeFunctionData(name, [addr]);
      const res = await provider.call({ to: tokenAddr, data });
      const decoded = iface.decodeFunctionResult(name, res);
      return decoded && decoded.length ? decoded[0] : null;
    } catch (e) {
      return null;
    }
  }

  console.log('Probing token:', tokenAddr);

  const paused = await probeNoArg('paused') ?? await probeNoArg('isPaused');
  console.log('paused:', paused);

  const mode = await probeNoArg('mode');
  console.log('mode:', mode);

  const owner = await probeNoArg('owner');
  console.log('owner:', owner);

  // If you want to check a specific address (example: your wallet or game wallet), pass via env USER_ADDR
  const userAddr = (process.env.USER_ADDR || '').toLowerCase();
  if (userAddr) {
    const isBlack = await probeAddrArg('isBlacklisted', userAddr) ?? await probeAddrArg('blacklist', userAddr) ?? await probeAddrArg('frozen', userAddr) ?? null;
    const isRestricted = await probeAddrArg('isRestricted', userAddr) ?? null;
    const isWhitelisted = await probeAddrArg('isWhitelisted', userAddr) ?? await probeAddrArg('whitelist', userAddr) ?? null;
    console.log(`user (${userAddr}) -> blacklisted: ${isBlack}, restricted: ${isRestricted}, whitelisted: ${isWhitelisted}`);
  }

  console.log('\nTip: if transfers are restricted you probably need to call setMode(3) with the owner account (or unpause, remove blacklist).');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
