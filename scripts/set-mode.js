/*
  Usage: node scripts/set-mode.js <contractAddress> <mode>
  Requires: RPC_URL and PRIVATE_KEY environment variables
  Example: RPC_URL=https://bsc-dataseed.binance.org PRIVATE_KEY=0x... node scripts/set-mode.js 0xContract 3

  This script attempts to call setMode(mode) on the given contract address.
  It will try a minimal ABI (setMode(uint8) / setMode(uint256)).
*/

const { ethers } = require('ethers');

async function main() {
  const rpc = process.env.RPC_URL || process.env.BNB_RPC_URL || process.env.ALCHEMY_URL;
  const pk = process.env.PRIVATE_KEY;

  if (!rpc) return console.error('RPC_URL (or BNB_RPC_URL/ALCHEMY_URL) is required');
  if (!pk) return console.error('PRIVATE_KEY is required to send transactions');

  const contractAddr = process.argv[2];
  const modeArg = process.argv[3];

  if (!contractAddr || !modeArg) return console.error('Usage: node scripts/set-mode.js <contractAddress> <mode>');

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  // Try both common ABI variants
  const abis = [
    ['function setMode(uint8 mode)'],
    ['function setMode(uint256 mode)'],
  ];

  let sent = false;
  for (const abi of abis) {
    try {
      const contract = new ethers.Contract(contractAddr, abi, wallet);
      console.log('Attempting setMode on', contractAddr, 'with abi', JSON.stringify(abi));
      const tx = await contract.setMode(Number(modeArg));
      console.log('Tx sent:', tx.hash);
      console.log('Waiting for confirmation...');
      const rcpt = await tx.wait(1);
      console.log('Confirmed in block', rcpt.blockNumber);
      sent = true;
      break;
    } catch (err) {
      console.warn('setMode variant failed:', err && err.message ? err.message : err);
    }
  }

  if (!sent) {
    console.error('Failed to call setMode. Confirm contract has setMode and your PRIVATE_KEY is owner/authorized.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
