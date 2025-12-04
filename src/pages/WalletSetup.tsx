import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Wallet, AlertCircle, CheckCircle, Loader, Download } from 'lucide-react';

export default function WalletSetup() {
  const navigate = useNavigate();
  const { wallet, connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);

  useEffect(() => {
    // Check if MetaMask is available
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

      // Check if it's actually MetaMask (not another wallet provider)
      const isMetaMask = eth.isMetaMask || (eth.providers && eth.providers.some((p: any) => p.isMetaMask));
      setHasMetaMask(Boolean(isMetaMask));
    };

    // Check immediately and after delay (in case MetaMask injects late)
    checkMetaMask();
    const timer = setTimeout(checkMetaMask, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already connected
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      navigate('/dashboard', { replace: true });
    }
  }, [wallet.isConnected, wallet.address, navigate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await connect();
      // On success, useEffect above will redirect to dashboard
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Wallet connection failed:', errorMsg);
      
      if (!hasMetaMask) {
        setError(
          'MetaMask not detected. Please install MetaMask extension from https://metamask.io'
        );
      } else if (errorMsg.includes('User rejected')) {
        setError('You rejected the wallet connection. Please try again.');
      } else if (errorMsg.includes('signature')) {
        setError('You rejected the signature request. Please try again to sign in.');
      } else {
        setError(errorMsg || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F5F3A] to-[#166C47] dark:from-[#0D3D24] dark:to-[#1a5a3a] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-2 pb-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0F5F3A] to-[#166C47] dark:from-[#22C55E] dark:to-[#34D399] flex items-center justify-center mx-auto mb-4"
            >
              <Wallet className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              Connect Your Wallet
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in to TreeFi with your MetaMask wallet
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="space-y-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                What happens next:
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-decimal list-inside">
                <li>MetaMask popup will appear</li>
                <li>Select your account and click "Connect"</li>
                <li>Sign the message to verify ownership</li>
                <li>You'll be logged in to TreeFi</li>
              </ol>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* MetaMask Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {hasMetaMask === null ? (
                  <>
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Checking for MetaMask...
                    </span>
                  </>
                ) : hasMetaMask ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      MetaMask detected ✓
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      MetaMask not found
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Connect Button */}
            {hasMetaMask === true ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                size="lg"
                className="w-full bg-[#0F5F3A] hover:bg-[#0D4A2E] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white text-base font-semibold"
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            ) : hasMetaMask === false ? (
              <a
                href="https://metamask.io/download"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-base font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install MetaMask
                </Button>
              </a>
            ) : (
              <Button
                disabled
                size="lg"
                className="w-full bg-gray-400 text-white text-base font-semibold"
              >
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Checking...
              </Button>
            )}

            {/* Fallback Links */}
            <div className="space-y-2 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
              {!hasMetaMask && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Don't have MetaMask? It's a free browser extension.
                </p>
              )}
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 block w-full"
              >
                Back to Home
              </button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 space-y-3 text-sm text-white/80"
        >
          <p className="text-center font-semibold text-white/90">Why MetaMask?</p>
          <ul className="space-y-2 text-center">
            <li>✓ Secure custody of your wallet</li>
            <li>✓ No private keys shared with TreeFi</li>
            <li>✓ Sign transactions without exposing secrets</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
