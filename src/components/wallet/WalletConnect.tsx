import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const WalletConnect = () => {
  const navigate = useNavigate();
  const { wallet, disconnect } = useWallet();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    // Auto-reconnect if previously connected
    const reconnect = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') {
        if ((window as any).ethereum) {
          // Silent auto-reconnect attempt; errors are ignored
        }
      }
    };
    reconnect();
  }, []);

  const handleConnect = () => {
    // Navigate to dedicated wallet setup page
    navigate('/wallet-setup');
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium text-[#1F2937] dark:text-[#E5E7EB]">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
          <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{wallet.balance} MATIC</span>
        </div>
        <Button onClick={handleDisconnect} variant="outline" size="sm" className="gap-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Disconnect</span>
        </Button>
      </div>
    );
  }

  // Always show the Connect button
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleConnect}
        className="bg-[#0F5F3A] hover:bg-[#0D4A2E] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white gap-2"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    </div>
  );
};