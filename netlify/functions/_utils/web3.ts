import { JsonRpcProvider, Interface, parseUnits } from 'ethers';

/**
 * Verify that a given txHash corresponds to an ERC20 Transfer of the expected amount to the expected recipient
 */
export async function verifyERC20Transfer(txHash: string, tokenAddress: string, to: string, expectedAmount: number | string, decimals = 18, providerOverride?: any) {
  const rpc = process.env.BNB_RPC_URL || process.env.RPC_URL || process.env.ALCHEMY_URL;
  if (!rpc && !providerOverride) throw new Error('RPC URL not configured (set BNB_RPC_URL)');

  const provider = providerOverride || new JsonRpcProvider(rpc as string);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return false;

  const iface = new Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
  const expected = parseUnits(String(expectedAmount), decimals);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue;
    try {
      const parsed = iface.parseLog(log);
      const toAddr = (parsed.args.to as string).toLowerCase();
      const val = parsed.args.value as bigint;
      if (toAddr === to.toLowerCase() && val === expected) {
        return true;
      }
    } catch (err) {
      // ignore parse errors for non-matching logs
    }
  }
  return false;
}

export default verifyERC20Transfer;
