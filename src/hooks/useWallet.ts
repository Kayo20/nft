import { useState, useEffect } from 'react';
import { WalletState } from '@/types';
import { connectWallet, disconnectWallet, switchToPolygon, getBalance } from '@/lib/web3';
import { BrowserProvider } from 'ethers';
import { requestNonce, verifySiwe, logout } from '@/lib/apiAuth';
import { getNFTs } from '@/lib/api';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: '0',
    isConnected: false,
  });
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const connect = async () => {
    try {
      const result = await connectWallet();
      
      // Switch to Polygon if not already on it
      if (result.chainId !== 137) {
        try {
          await switchToPolygon();
        } catch (switchErr) {
          console.warn('Failed to switch to Polygon, continuing anyway:', switchErr);
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
        // Still keep user connected even if profile fetch fails; show error in UI
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
  };

  useEffect(() => {
    // Auto-reconnect if user previously connected and MetaMask is available
    if (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') {
      if ((window as any).ethereum) {
        connect().catch(() => {
          // swallow errors on auto reconnect
        });
      }
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        // disconnected
        setWallet({ address: null, chainId: null, balance: '0', isConnected: false });
        localStorage.removeItem('walletConnected');
      } else {
        setWallet(prev => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = Number(chainIdHex.startsWith('0x') ? parseInt(chainIdHex, 16) : chainIdHex);
      setWallet(prev => ({ ...prev, chainId }));
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

  return { wallet, connect, disconnect, userData, isLoadingProfile };
}