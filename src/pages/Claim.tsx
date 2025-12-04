import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { mockApi } from '@/lib/mockApi';
import { Coins, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Claim() {
  const { wallet } = useWallet();
  const [tfBalance, setTfBalance] = useState(0);
  const [claimableAmount, setClaimableAmount] = useState(156.78);
  const [feePercentage, setFeePercentage] = useState(30);
  const [netAmount, setNetAmount] = useState(0);
  const [daysSinceLastClaim, setDaysSinceLastClaim] = useState(5);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const net = claimableAmount * (1 - feePercentage / 100);
    setNetAmount(net);
  }, [claimableAmount, feePercentage]);

  const handleClaim = async () => {
    setShowConfirmDialog(false);
    setIsClaiming(true);

    try {
      // Simulate claim
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Claim successful!', {
        description: `You received ${netAmount.toFixed(2)} TF tokens`,
      });
      
      setTfBalance(prev => prev + netAmount);
      setClaimableAmount(0);
    } catch (error) {
      toast.error('Transaction failed', {
        description: 'An error occurred during claim',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Claim Rewards</h1>
        <p className="text-gray-600 dark:text-gray-400">Claim your earned TF tokens</p>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Alert className="mb-8 border-[#166C47] dark:border-[#22C55E] bg-[#0F5F3A]/5 dark:bg-[#22C55E]/5">
          <Info className="h-4 w-4 text-[#0F5F3A] dark:text-[#22C55E]" />
          <AlertDescription className="text-gray-900 dark:text-white">
            Claim fees decrease daily from 25% to 0% over 10 days. Wait longer to maximize your rewards!
          </AlertDescription>
        </Alert>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* TF Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-[#E2B13C]/50 dark:border-[#FCD34D]/50 bg-gradient-to-br from-[#E2B13C]/10 to-[#E2B13C]/5 dark:from-[#FCD34D]/10 dark:to-[#FCD34D]/5">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
                Your TF Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-[#0F5F3A] dark:text-[#22C55E] mb-2">
                {tfBalance.toFixed(2)} TF
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">TreeFi Tokens</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Claimable Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Claimable Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <p className="text-6xl font-bold text-[#0F5F3A] dark:text-[#22C55E] mb-2">
                  {claimableAmount.toFixed(2)}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">TF Tokens Available</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fees & Claim */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 border-[#C43B3B]/50 dark:border-[#EF4444]/50 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gross Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{claimableAmount.toFixed(2)} TF</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Claim Fee ({feePercentage}%)</span>
                  <span className="font-semibold text-[#C43B3B] dark:text-[#EF4444]">
                    -{(claimableAmount * feePercentage / 100).toFixed(2)} TF
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#E2B13C]/10 dark:bg-[#FCD34D]/10 rounded-lg border-2 border-[#E2B13C]/30 dark:border-[#FCD34D]/30">
                  <span className="text-base font-medium text-gray-900 dark:text-white">You Will Receive</span>
                  <span className="text-3xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">
                    {netAmount.toFixed(2)} TF
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isClaiming || claimableAmount === 0}
                className="w-full bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white gap-2 py-6 text-lg"
              >
                <Coins className="w-5 h-5" />
                {isClaiming ? 'Claiming...' : 'Claim TF Tokens'}
              </Button>

              {feePercentage > 0 && (
                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Wait {10 - daysSinceLastClaim} more day(s) to claim with 0% fee
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Coins className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
              Confirm Claim
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Review your claim details before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gross Amount</span>
              <span className="font-semibold text-gray-900 dark:text-white">{claimableAmount.toFixed(2)} TF</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Fee ({feePercentage}%)</span>
              <span className="font-semibold text-[#C43B3B] dark:text-[#EF4444]">
                -{(claimableAmount * feePercentage / 100).toFixed(2)} TF
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#E2B13C]/10 dark:bg-[#FCD34D]/10 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">You will receive</span>
              <span className="text-xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{netAmount.toFixed(2)} TF</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleClaim} className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626]">
              Confirm Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}