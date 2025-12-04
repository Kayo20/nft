import { Button } from '@/components/ui/button';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

export const WalletConnect = () => {
  const { wallet, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    // Check for MetaMask availability (non-blocking). We keep the
    // Connect UI visible regardless of this flag so users are not
    // urged to install anything; errors are shown only after click.
    const checkMetaMask = () => {
      if (typeof window === 'undefined') {
        setHasMetaMask(false);
        return;
      }
      const eth = (window as any).ethereum;
      if (!eth) {
        setHasMetaMask(false);
        return;
      }

      if (Array.isArray(eth.providers)) {
        const mm = eth.providers.find((p: any) => p.isMetaMask === true || p.isMetaMask === 'true');
        setHasMetaMask(Boolean(mm));
        return;
      }

      const isMeta = Boolean(eth.isMetaMask || (eth.request && eth.request instanceof Function));
      setHasMetaMask(isMeta);
    };

    checkMetaMask();

    // Also check after a short delay in case a provider injects late
    const timer = setTimeout(checkMetaMask, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // If there's no injected provider, let the wallet hook handle
      // the failure; we show a neutral message instead of instructing
      // the user to install MetaMask.
      await connect();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Connect error:', errorMsg);
      // If there's no provider detected, show a neutral message.
      if (typeof window !== 'undefined' && !(window as any).ethereum) {
        setError('No wallet provider detected in your browser. Connect failed.');
      } else {
        setError(errorMsg || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
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

  // Always show the Connect button (no install prompt). If a provider
  // exists, the click will attempt to connect; otherwise a neutral
  // error is displayed after the attempt.

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-[#0F5F3A] hover:bg-[#0D4A2E] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  );
};