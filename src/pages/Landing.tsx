import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { generateMockNFTs } from '@/lib/mockApi';
import { TreeCard } from '@/components/nft/TreeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SnowEffect } from '@/components/animations/SnowEffect';
import { Countdown } from '@/components/Countdown';
import { useNavigate } from 'react-router-dom';
import {
  TreePine,
  Coins,
  Zap,
  Users,
  Gift,
  Sparkles,
  Package,
  Sprout,
  ShoppingCart,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import PinksaleLogo from '@/assets/pinksale-logo.svg';
import DexviewLogo from '@/assets/dexview-logo.svg';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Package className="w-8 h-8" />,
      title: 'Open Chests',
      description: 'Open chests with TF Token to mint your NFT trees and grow your collection',
    },
    {
      icon: <TreePine className="w-8 h-8" />,
      title: 'Plant & Grow Trees',
      description: 'Plant your trees in 9 land slots and watch them grow into valuable NFT trees',
    },
    {
      icon: <Sprout className="w-8 h-8" />,
      title: 'Feed Your Trees',
      description: 'Use Water, Fertilizer, and Anti-Bug items every 4h to boost production and keep trees healthy',
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: 'Earn TF Tokens',
      description: 'Generate passive income daily from your tree collection with progressive claim fees',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Fusion System',
      description: 'Combine 3 same-rarity trees to create higher rarity trees and increase power',
    },
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: 'Shop & Upgrade',
      description: 'Buy items with TF tokens to burn supply and make the token more stable long-term',
    },
  ];

  // New power values and color mapping
  const rarities = [
    { name: 'Uncommon', color: '#6B7280', power: 100 },
    { name: 'Rare', color: '#3B82F6', power: 400 },
    { name: 'Epic', color: '#A855F7', power: 1400 },
    { name: 'Legendary', color: '#E2B13C', power: 5000 },
  ];

  // Generate one mock NFT per rarity for display
  const [rarityTrees, setRarityTrees] = useState([]);
  useEffect(() => {
    // Use generateMockNFTs to get a random tree for each rarity
    const all = generateMockNFTs(12);
    const byRarity = rarities.map(r => all.find(t => t.rarity === r.name) || all[0]);
    setRarityTrees(byRarity);
    // eslint-disable-next-line
  }, []);

  const tokenomics = [
    { label: 'Rewards Pool', value: '70%', icon: <Gift className="w-5 h-5" />, percent: 70 },
    { label: 'Presale', value: '10%', icon: <Package className="w-5 h-5" />, percent: 10 },
    { label: 'Liquidity', value: '10%', icon: <Users className="w-5 h-5" />, percent: 10 },
    { label: 'Team', value: '5%', icon: <Award className="w-5 h-5" />, percent: 5 },
    { label: 'Marketing', value: '5%', icon: <Sparkles className="w-5 h-5" />, percent: 5 },
    { label: 'Total Supply', value: '100M TF', icon: <Coins className="w-5 h-5" />, percent: null },
  ];
  // Always show Total Supply first, then the rest sorted by percent descending
  const sortedTokenomics = [
    tokenomics.find(t => t.label === 'Total Supply'),
    ...tokenomics.filter(t => t.label !== 'Total Supply').sort((a, b) => {
      if (a.percent == null) return 1;
      if (b.percent == null) return -1;
      return b.percent - a.percent;
    })
  ];

  return (
    <div className="min-h-screen">
      <SnowEffect />

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block"
          >
              <Badge className="bg-[#C43B3B] dark:bg-[#EF4444] text-white px-6 py-2 text-sm">
                🎄 Season 0 - Special Edition
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-center pt-4"
          >
            <a
              href="https://www.pinksale.finance/launchpad/polygon/0x6CB4391Bcd92e0f81a2b02fa735Ec63a20D6Dab0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-pink-500 hover:bg-pink-600 text-white text-lg px-8 py-4"
              >
                TF Token Fairlaunch
              </Button>
            </a>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#0F5F3A] via-[#166C47] to-[#0F5F3A] dark:from-[#22C55E] dark:via-[#34D399] dark:to-[#22C55E] bg-clip-text text-transparent leading-tight">
            Welcome to TreeFi
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Grow your tree NFT collection, earn rewards, and celebrate the festive season on Polygon
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <Button
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-lg px-8 py-6 gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Game
            </Button>
            <a
              href="https://treefii-1.gitbook.io/treefii-docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-[#0F5F3A] dark:border-[#22C55E] text-[#0F5F3A] dark:text-[#22C55E] hover:bg-[#0F5F3A] hover:text-white dark:hover:bg-[#22C55E] dark:hover:text-gray-900 text-lg px-8 py-6"
              >
                Whitepaper
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-3 gap-4 pt-12 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">100M TF</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Supply</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">4</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rarity Tiers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">Polygon</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Simple, fun, and rewarding. Start growing your tree empire today!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-800 hover:border-[#0F5F3A] dark:hover:border-[#22C55E] bg-white dark:bg-gray-900">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0F5F3A] to-[#166C47] dark:from-[#22C55E] dark:to-[#34D399] flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Season 0 Details */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <Badge className="bg-[#E2B13C] dark:bg-[#FCD34D] text-gray-900 px-6 py-2 text-sm mb-4">
              <Clock className="w-4 h-4 inline mr-2" />
              Season 0 Countdown
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Season 0 Details</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Season 0 starts in 15 days. Get exclusive early benefits!
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl p-8 mb-8 border-2 border-[#E2B13C] dark:border-[#FCD34D]">
              <Countdown targetDate={new Date('2025-12-17T00:00:00Z')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-900 border-2 border-[#0F5F3A] dark:border-[#22C55E]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[#0F5F3A] dark:bg-[#22C55E] flex items-center justify-center text-white mb-2">
                  <TreePine className="w-6 h-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">9 Tree Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Each land comes with 9 slots to plant and grow your NFT trees
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-2 border-[#C43B3B] dark:border-[#EF4444]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[#C43B3B] dark:bg-[#EF4444] flex items-center justify-center text-white mb-2">
                  <Gift className="w-6 h-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">First 200 Members</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Get 2 free mints + OG role in Discord for early supporters
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-2 border-[#A855F7] dark:border-[#C084FC]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[#A855F7] dark:bg-[#C084FC] flex items-center justify-center text-white mb-2">
                  <Package className="w-6 h-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Open Chests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Open chests with TF tokens to mint your NFT trees
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* Tokenomics Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">TF Token Tokenomics</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Transparent and sustainable token distribution on Polygon
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {sortedTokenomics.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-[#0F5F3A] dark:hover:border-[#22C55E] transition-all">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0F5F3A] to-[#166C47] dark:from-[#22C55E] dark:to-[#34D399] flex items-center justify-center text-white mx-auto mb-2">
                      {item.icon}
                    </div>
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-400">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{item.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Rarity System */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">NFTs</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Each tree has unique power based on its rarity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {rarities.map((rarity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
            >
              <Card
                className="h-full border-2 hover:shadow-xl transition-all bg-white dark:bg-gray-900 flex flex-col items-center"
                style={{ borderColor: rarity.color }}
              >
                <CardHeader className="w-full flex flex-col items-center">
                  <div className="w-full flex justify-center mb-4">
                    {rarityTrees[index] && (
                      <img
                        src={rarityTrees[index].image}
                        alt={rarity.name + ' NFT Tree'}
                        className="w-72 h-72 object-contain"
                        style={{ display: 'block', background: 'none' }}
                      />
                    )}
                  </div>
                  <CardTitle className="text-xl" style={{ color: rarity.color }}>
                    {rarity.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Power</span>
                    <span className="font-semibold text-[#0F5F3A] dark:text-[#22C55E]">{rarity.power}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Partners</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Proudly powered by industry-leading platforms
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Pinksale */}
          <motion.a
            href="https://www.pinksale.finance/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            whileHover={{ scale: 1.05, y: -8 }}
          >
            <Card className="h-full border-2 border-pink-300 dark:border-pink-600 hover:shadow-xl transition-all bg-white dark:bg-gray-900 cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center h-full gap-4">
                <div className="w-40 h-40 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900 rounded-xl flex items-center justify-center">
                  <img
                    src="/pinksale.png"
                    alt="Pinksale Logo"
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PinksaleLogo;
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pinksale</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Leading decentralized launchpad platform for token sales and IDOs
                </p>
                <Badge className="bg-pink-500 hover:bg-pink-600 text-white">Fair Launch</Badge>
              </CardContent>
            </Card>
          </motion.a>

          {/* Dexview */}
          <motion.a
            href="https://www.dexview.com/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -8 }}
          >
            <Card className="h-full border-2 border-blue-300 dark:border-blue-600 hover:shadow-xl transition-all bg-white dark:bg-gray-900 cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center h-full gap-4">
                <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 rounded-xl flex items-center justify-center">
                  <img
                    src="/dexview.png"
                    alt="Dexview Logo"
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DexviewLogo;
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dexview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Real-time analytics and trading insights for decentralized exchanges
                </p>
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Analytics</Badge>
              </CardContent>
            </Card>
          </motion.a>

          {/* Polygon */}
          <motion.a
            href="https://polygon.technology/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -8 }}
          >
            <Card className="h-full border-2 border-purple-300 dark:border-purple-600 hover:shadow-xl transition-all bg-white dark:bg-gray-900 cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center h-full gap-4">
                <div className="w-40 h-40 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950 dark:to-purple-900 rounded-xl flex items-center justify-center">
                  <img
                    src="https://cryptologos.cc/logos/polygon-matic-logo.png"
                    alt="Polygon Logo"
                    className="w-32 h-32"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://polygon.technology/_next/static/media/polygon-logo-purple.3b0b6b42.svg';
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Polygon</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Ethereum's leading Layer 2 scaling solution for fast, low-cost transactions
                </p>
                <Badge className="bg-purple-500 hover:bg-purple-600 text-white">L2 Chain</Badge>
              </CardContent>
            </Card>
          </motion.a>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-[#0F5F3A] to-[#166C47] dark:from-[#166C47] dark:to-[#22C55E] rounded-2xl p-12 text-center text-white"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Start Growing?</h2>
          <p className="text-xl mb-8 opacity-90">
            Connect your wallet and begin your TreeFi journey on Polygon today
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-lg px-12 py-6"
          >
            Launch Dashboard
          </Button>
        </motion.div>
      </section>
    </div>
  );
}