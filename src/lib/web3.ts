import { BrowserProvider, formatEther } from 'ethers';
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