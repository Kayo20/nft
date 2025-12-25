import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute: Wrapper component that enforces wallet connection
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { wallet, connect } = useWallet();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      await connect();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setConnectError(errorMsg || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Step 2: Wallet connection gate (after password unlock)
  if (!wallet.isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-8 rounded-lg">
            <Wallet className="w-16 h-16 mx-auto text-green-600 dark:text-green-400 mb-4" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Wallet to Continue
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
              You need to connect your wallet to access this page and interact with TreeFi.
            </p>
          </div>
          {connectError && (
            <div className="w-full max-w-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{connectError}</p>
            </div>
          )}
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#0F5F3A] hover:bg-[#0D4A2E] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white gap-2 px-8 py-6 text-lg"
          >
            <Wallet className="w-5 h-5" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    );
  }

  // All gates passed: render the protected page
  return <>{children}</>;
};
