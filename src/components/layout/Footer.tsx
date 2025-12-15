import { TreePine, Send } from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { DiscordIcon } from '@/components/icons/DiscordIcon';

export const Footer = () => {
  return (
    <footer className="border-t border-[#166C47]/20 bg-[#F4F6F8] mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="w-12 h-12" />
            </div>
            <p className="text-sm text-[#6B7280]">
              Web3 farming game on BNB Smart Chain. Grow your trees, earn rewards!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-[#1F2937] mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><a href="/dashboard" className="hover:text-[#0F5F3A] transition-colors">Dashboard</a></li>
              <li><a href="/shop" className="hover:text-[#0F5F3A] transition-colors">Shop</a></li>
              <li><a href="/fusion" className="hover:text-[#0F5F3A] transition-colors">Fusion</a></li>
              <li><a href="/claim" className="hover:text-[#0F5F3A] transition-colors">Claim</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-[#1F2937] mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><a href="https://treefi.gitbook.io/treefi-docs/documentation/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0F5F3A] transition-colors">Whitepaper</a></li>
              {/* <li><a href="#" className="hover:text-[#0F5F3A] transition-colors">Documentation</a></li> */}
              <li><a href="#" className="hover:text-[#0F5F3A] transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-[#0F5F3A] transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-[#1F2937] mb-3">Community</h3>
            <div className="flex gap-3">
              <a href="https://x.com/TreeFii" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#0F5F3A] flex items-center justify-center text-white hover:bg-[#166C47] transition-colors">
                <XIcon className="w-4 h-4" />
              </a>
              <a href="https://discord.gg/DMzBN6we67" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#0F5F3A] flex items-center justify-center text-white hover:bg-[#166C47] transition-colors">
                <DiscordIcon className="w-4 h-4" />
              </a>
              <a href="https://t.me/treefii3" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#0F5F3A] flex items-center justify-center text-white hover:bg-[#166C47] transition-colors">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#166C47]/20 text-center text-sm text-[#6B7280]">
          <p>&copy; {new Date().getFullYear()} TreeFi. All rights reserved. Built on BNB Smart Chain.</p>
        </div>
      </div>
    </footer>
  );
};