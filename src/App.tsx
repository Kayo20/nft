import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Index from './pages/Index';
import Landing from './pages/Landing';
import WalletSetup from './pages/WalletSetup';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Fusion from './pages/Fusion';
import Claim from './pages/Claim';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-pink-50 via-gray-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <Navbar />
            <main className="pb-20 md:pb-0">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/wallet-setup" element={<WalletSetup />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                <Route path="/fusion" element={<ProtectedRoute><Fusion /></ProtectedRoute>} />
                <Route path="/claim" element={<ProtectedRoute><Claim /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <BottomNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;