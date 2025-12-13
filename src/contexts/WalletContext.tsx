import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { WalletState } from '@/types';
import { connectWallet, disconnectWallet, switchToBNB } from '@/lib/web3';
import { BrowserProvider } from 'ethers';
import { requestNonce, verifySiwe, logout } from '@/lib/apiAuth';
import { getNFTs } from '@/lib/api';

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  userData: any;
  isLoadingProfile: boolean;
  isInitializing: boolean;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: '0',
    isConnected: false,
  });
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const connect = async () => {
    try {
      const result = await connectWallet();

      // Switch to BNB Chain if not already on it
      if (result.chainId !== 56) {
        try {
          await switchToBNB();
        } catch (switchErr) {
          console.warn('Failed to switch to BNB Chain, continuing anyway:', switchErr);
        }
      }

      // Begin SIWE flow: request nonce, build message, sign, verify
      const { nonce } = await requestNonce(result.address);

      const buildSiweMessage = ({ domain, address, statement, uri, version, chainId, nonce }: any) => {
        const issuedAt = new Date().toISOString();
        return `${domain} wants you to sign in with Ethereum to the app:\n\n${address}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
      };

      const messageToSign = buildSiweMessage({
        domain: window.location.host,
        address: result.address,
        statement: 'Sign in to TreeFi.',
        uri: window.location.origin,
        version: '1',
        chainId: result.chainId,
        nonce,
      });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(messageToSign);

      await verifySiwe(messageToSign, signature);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', result.address);

      setWallet({
        address: result.address,
        chainId: result.chainId,
        balance: result.balance,
        isConnected: true,
      });

      // Fetch user profile/inventory from backend using wallet address
      try {
        setIsLoadingProfile(true);
        const nfts = await getNFTs(result.address);
        setUserData({ nfts, address: result.address, fetchedAt: new Date() });
      } catch (profileErr) {
        console.warn('Failed to fetch user profile:', profileErr);
        setUserData({ address: result.address, error: 'Failed to load profile' });
      } finally {
        setIsLoadingProfile(false);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error (may be expected if not authenticated):', err);
    }
    disconnectWallet();
    setWallet({
      address: null,
      chainId: null,
      balance: '0',
      isConnected: false,
    });
    setUserData(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  // Initialize wallet connection on app load
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Auto-reconnect if user previously connected and MetaMask is available
        if (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') {
          if ((window as any).ethereum) {
            // Attempt silent reconnection
            try {
              // Get accounts from MetaMask without requesting new connection
              const accounts = await (window as any).ethereum.request({
                method: 'eth_accounts',
              });

              if (accounts && accounts.length > 0) {
                const address = accounts[0];
                const provider = new BrowserProvider(window.ethereum);
                const network = await provider.getNetwork();
                const balanceRaw = await provider.getBalance(address);
                const balance = parseFloat((Number(balanceRaw) / 1e18).toFixed(4)).toString();

                setWallet({
                  address,
                  chainId: Number(network.chainId),
                  balance,
                  isConnected: true,
                });

                // Fetch user profile
                try {
                  setIsLoadingProfile(true);
                  const nfts = await getNFTs(address);
                  setUserData({ nfts, address, fetchedAt: new Date() });
                } catch (profileErr) {
                  console.warn('Failed to fetch user profile during init:', profileErr);
                  setUserData({ address, error: 'Failed to load profile' });
                } finally {
                  setIsLoadingProfile(false);
                }
              }
            } catch (err) {
              console.warn('Failed to auto-reconnect wallet:', err);
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletAddress');
            }
          }
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWallet();
  }, []);

  // Setup event listeners for account/chain changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        // Disconnected
        setWallet({ address: null, chainId: null, balance: '0', isConnected: false });
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
      } else {
        setWallet((prev) => ({ ...prev, address: accounts[0] }));
        localStorage.setItem('walletAddress', accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = Number(chainIdHex.startsWith('0x') ? parseInt(chainIdHex, 16) : chainIdHex);
      setWallet((prev) => ({ ...prev, chainId }));
    };

    if ((window as any).ethereum && (window as any).ethereum.on) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if ((window as any).ethereum && (window as any).ethereum.removeListener) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const value: WalletContextType = {
    wallet,
    connect,
    disconnect,
    userData,
    isLoadingProfile,
    isInitializing,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
