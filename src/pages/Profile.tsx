import { useWallet } from '@/hooks/useWallet';
import { useNFTs } from '@/hooks/useNFTs';
import { useUserBalances } from '@/hooks/useUserBalances';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { User, Wallet, TreePine, Coins, LogOut, Copy, ExternalLink, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { RARITY_COLORS } from '@/lib/constants';

export default function Profile() {
  const { wallet, disconnect } = useWallet();
  const demoAddress = wallet.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const { nfts } = useNFTs(demoAddress);
  const { tfBalance } = useUserBalances(wallet.address);

  const copyAddress = () => {
    navigator.clipboard.writeText(demoAddress);
    toast.success('Address copied!', {
      description: 'Wallet address copied to clipboard',
    });
  };

  const openInExplorer = () => {
    window.open(`https://bscscan.com/address/${demoAddress}`, '_blank');
  };

  const totalYield = nfts.reduce((sum, nft) => sum + nft.dailyYield, 0);
  const totalPower = nfts.reduce((sum, nft) => sum + nft.power, 0);
  
  // Group trees by rarity
  const treesByRarity = nfts.reduce((acc, nft) => {
    if (!acc[nft.rarity]) {
      acc[nft.rarity] = [];
    }
    acc[nft.rarity].push(nft);
    return acc;
  }, {} as Record<string, typeof nfts>);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">View your account details and statistics</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-[#0F5F3A] dark:text-[#22C55E]" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Wallet Address</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-900 dark:text-white break-all">
                      {demoAddress}
                    </code>
                    <Button
                      onClick={copyAddress}
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={openInExplorer}
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Network</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">BNB Smart Chain</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Balance</label>
                    <p className="text-lg font-semibold text-[#0F5F3A] dark:text-[#22C55E]">{wallet.balance} BNB</p>
                  </div>
                </div>

                <Separator />

                {wallet.isConnected && (
                  <Button
                    onClick={disconnect}
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect Wallet
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Trees by Rarity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-2">
                  <TreePine className="w-6 h-6 text-[#0F5F3A] dark:text-[#22C55E]" />
                  Trees by Rarity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['Uncommon', 'Rare', 'Epic', 'Legendary'].map((rarity) => {
                  const trees = treesByRarity[rarity] || [];
                  const rarityPower = trees.reduce((sum, tree) => sum + tree.power, 0);
                  
                  return (
                    <div key={rarity} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] }}
                          />
                          <span className="font-semibold text-gray-900 dark:text-white">{rarity}</span>
                        </div>
                        <Badge variant="secondary">{trees.length} Trees</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          Total Power
                        </span>
                        <span className="font-bold text-[#0F5F3A] dark:text-[#22C55E]">{rarityPower}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Token Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-[#E2B13C]/50 dark:border-[#FCD34D]/50 bg-gradient-to-br from-[#E2B13C]/10 to-[#E2B13C]/5 dark:from-[#FCD34D]/10 dark:to-[#FCD34D]/5">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
                  TF Token Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-[#0F5F3A] dark:text-[#22C55E] mb-2">{tfBalance.toFixed(2)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">TreeFi Tokens</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Collection Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Collection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Trees</span>
                  <span className="text-xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{nfts.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Power</span>
                  <span className="text-xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{totalPower}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Daily Yield</span>
                  <span className="text-xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{totalYield} TF</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/inventory">View Inventory</a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/shop">Buy Items</a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/claim">Claim Rewards</a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}