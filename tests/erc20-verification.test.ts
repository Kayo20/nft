import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { providers, Interface, parseUnits } from 'ethers';
import { verifyERC20Transfer } from '../netlify/functions/_utils/web3';

describe('verifyERC20Transfer', () => {
  const tokenAddress = '0x1111111111111111111111111111111111111111';
  const to = '0x2222222222222222222222222222222222222222';
  const txHash = '0x' + 'a'.repeat(64);

  beforeEach(() => {
    // Ensure RPC env var is set so the helper will attempt to create a provider
    process.env.BNB_RPC_URL = 'http://mock.local';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.BNB_RPC_URL;
  });

  it('returns true when receipt contains a valid Transfer to expected recipient with expected amount', async () => {
    const iface = new Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
    const expectedAmount = '150000';
    const parsedAmount = parseUnits(expectedAmount, 18);
    const from = '0x3333333333333333333333333333333333333333';

    const encoded = iface.encodeEventLog(iface.getEvent('Transfer'), [from, to, parsedAmount]);

    const mockReceipt = { logs: [{ address: tokenAddress, topics: encoded.topics, data: encoded.data }] } as any;

    // Provide a minimal JsonRpcProvider mock that returns our mock receipt
    const mockProvider = { async getTransactionReceipt(_tx: string) { return mockReceipt; } };

    const result = await verifyERC20Transfer(txHash, tokenAddress, to, expectedAmount, 18, mockProvider as any);
    expect(result).toBe(true);
  });

  it('returns false when no matching logs are found', async () => {
    const mockReceipt = { logs: [] } as any;
    const mockProvider = { async getTransactionReceipt(_tx: string) { return mockReceipt; } };
    const result = await verifyERC20Transfer(txHash, tokenAddress, to, '150000', 18, mockProvider as any);
    expect(result).toBe(false);
  });

  it('returns false when receipt not found', async () => {
    const mockProvider = { async getTransactionReceipt(_tx: string) { return null; } };
    const result = await verifyERC20Transfer(txHash, tokenAddress, to, '150000', 18, mockProvider as any);
    expect(result).toBe(false);
  });
});
