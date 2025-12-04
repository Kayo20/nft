import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, ShoppingBag, Merge, Coins, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/fusion', label: 'Fusion', icon: Merge },
  { path: '/claim', label: 'Claim', icon: Coins },
  { path: '/profile', label: 'Profile', icon: User },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center gap-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-0 right-0 h-0.5 bg-[#0F5F3A] dark:bg-[#22C55E]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? 'text-[#0F5F3A] dark:text-[#22C55E]'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive
                    ? 'text-[#0F5F3A] dark:text-[#22C55E] font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};