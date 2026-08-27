'use client';

import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';
import Link from 'next/link';

interface DashboardHeaderProps {
  userEmail: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userEmail }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 w-full py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image
              src="/Logo.png"
              alt="WeatherComfort Analytics Logo"
              width={32}
              height={32}
              className="object-contain rounded-md"
            />
            <span className="font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
              WeatherComfort
              <span className="hidden sm:inline text-zinc-500 font-normal">Analytics</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#comfort-index"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Comfort Index
            </Link>
          </nav>

          {/* Action Group */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {userEmail}
            </span>
            <ThemeToggle />
            <a
              href="/auth/logout"
              className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-1.5 shrink-0" />
              <span>Sign Out</span>
            </a>
          </div>

          {/* Mobile Header Buttons */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-6 space-y-4 shadow-lg transition-all duration-300">
          <nav className="flex flex-col gap-4">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
            >
              How It Works
            </Link>
            <Link
              href="/#comfort-index"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
            >
              Comfort Index
            </Link>
          </nav>
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center">
              {userEmail}
            </div>
            <a
              href="/auth/logout"
              className="flex items-center justify-center w-full py-3 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm transition-all"
            >
              <LogOut className="w-4 h-4 mr-2 shrink-0" />
              Sign Out
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
