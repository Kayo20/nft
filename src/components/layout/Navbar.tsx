import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, TreePine, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/shop', label: 'Shop' },
  { path: '/fusion', label: 'Fusion' },
  { path: '/claim', label: 'Claim' },
  { path: '/profile', label: 'Profile' },
];

export const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Logo" className="w-12 h-12" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-[#0F5F3A] dark:hover:text-[#22C55E] ${
                location.pathname === item.path
                  ? 'text-[#0F5F3A] dark:text-[#22C55E] border-b-2 border-[#0F5F3A] dark:border-[#22C55E]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden md:flex"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* Wallet Connect */}
          <div className="hidden md:block">
            <WalletConnect />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-white dark:bg-gray-900">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-lg font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'text-[#0F5F3A] dark:text-[#22C55E]'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="w-full justify-start gap-2"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="w-4 h-4" />
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        Light Mode
                      </>
                    )}
                  </Button>
                  <WalletConnect />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};