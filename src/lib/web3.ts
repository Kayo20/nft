import { BrowserProvider, formatEther, Contract, parseUnits, formatUnits } from 'ethers';
import ERC20_ABI from '@/lib/erc20Abi';
import { BNB_CHAIN_ID } from './constants';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export const checkMetaMask = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

export const connectWallet = async (): Promise<{
  address: string;
  chainId: number;
  balance: string;
}> => {
  if (!checkMetaMask()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request accounts directly from the provider for better compatibility
    const accounts = (await window.ethereum!.request({ method: 'eth_requestAccounts' })) as string[];
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const balanceRaw = await provider.getBalance(accounts[0]);
    const balance = parseFloat(formatEther(balanceRaw)).toFixed(4);

    return {
      address: accounts[0],
      chainId: Number(network.chainId),
      balance,
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getBalance = async (address: string): Promise<string> => {
  if (!checkMetaMask()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const balanceRaw = await provider.getBalance(address);
    return parseFloat(formatEther(balanceRaw)).toFixed(4);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
};

export const switchToBNB = async (): Promise<void> => {
  if (!checkMetaMask()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${BNB_CHAIN_ID.toString(16)}` }],
    });
  } catch (switchError) {
    const error = switchError as { code?: number };
    // Chain not added, add it
    if (error.code === 4902) {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${BNB_CHAIN_ID.toString(16)}`,
            chainName: 'BNB Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: ['https://bsc-dataseed.bnbchain.org/'],
            blockExplorerUrls: ['https://bscscan.com/'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

export const disconnectWallet = (): void => {
  // MetaMask doesn't have a disconnect method, but we can clear local state
  localStorage.removeItem('walletConnected');
};

/**
 * Get ERC20 token balance for an address using the injected provider (MetaMask).
 * Returns a numeric string formatted with up to 4 decimals.
 */
export const getERC20Balance = async (tokenAddress: string, address: string, decimals = 18): Promise<string> => {
  if (!checkMetaMask()) throw new Error('MetaMask is not installed');

  try {
    const provider = new BrowserProvider(window.ethereum);
    // Use provider (read-only) to avoid requiring signer for balanceOf
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const raw = await contract.balanceOf(address);
    return parseFloat(formatUnits(raw, decimals)).toFixed(4);
  } catch (err) {
    console.error('Failed to fetch ERC20 balance:', err);
    throw err;
  }
};

/**
 * Transfer ERC20 tokens from the connected wallet to a destination address.
 * amount is a human-readable number (e.g. 150000) and will be parsed to token decimals (default 18).
 */
export const transferERC20 = async (tokenAddress: string, to: string, amount: string | number, decimals = 18) => {
  if (!checkMetaMask()) throw new Error('MetaMask is not installed');

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);
    const parsed = parseUnits(String(amount), decimals);
    const tx = await contract.transfer(to, parsed);
    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    return receipt;
  } catch (err) {
    console.error('ERC20 transfer failed', err);
    throw err;
  }
};