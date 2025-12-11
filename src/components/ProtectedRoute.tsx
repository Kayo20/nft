import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Wallet, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const DEV_PASSWORD = 'dev678_';

/**
 * ProtectedRoute: Wrapper component that enforces:
 * 1. Password unlock (temporary dev gate)
 * 2. Wallet connection
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { wallet, connect } = useWallet();
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState<string | null>(null);

  // Check if unlocked in session storage
  React.useEffect(() => {
    const unlocked = sessionStorage.getItem('devPageUnlocked') === 'true';
    setIsUnlocked(unlocked);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password === DEV_PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem('devPageUnlocked', 'true');
      setPassword('');
    } else {
      setPasswordError('Incorrect password. Access denied.');
      setPassword('');
    }
  };

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

  // Step 1: Password gate (before anything else)
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-full">
              <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Development Mode
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
            This project is in development. Please enter the access password.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#0F5F3A] hover:bg-[#0D4A2E] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white"
            >
              Unlock Access
            </Button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            This is a temporary development gate. It will be removed upon project launch.
          </p>
        </div>
      </div>
    );
  }

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
