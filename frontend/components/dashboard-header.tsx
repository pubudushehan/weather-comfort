'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';
import Link from 'next/link';
import logoImg from '../public/Logo.png';

export const DashboardHeader: React.FC = () => {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === '/') {
      e.preventDefault();
      setMobileMenuOpen(false);
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };



  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800/80 py-3 shadow-sm'
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image
              src={logoImg}
              alt="WeatherComfort Analytics Logo"
              width={50}
              height={50}
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
              onClick={(e) => handleNavClick(e, 'features')}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#comfort-index"
              onClick={(e) => handleNavClick(e, 'comfort-index')}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Comfort Index
            </Link>
          </nav>

          {/* Action Group */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
            ) : user ? (
              <>

                {pathname !== '/dashboard' && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm cursor-pointer"
                  >
                    Dashboard
                  </Link>
                )}
                <a
                  href="/auth/logout"
                  className="inline-flex items-center justify-center px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Sign Out</span>
                </a>
              </>
            ) : (
              <a
                href="/auth/login"
                className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm cursor-pointer"
              >
                Sign In
              </a>
            )}
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
              onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, 'features'); }}
              className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, 'how-it-works'); }}
              className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
            >
              How It Works
            </Link>
            <Link
              href="/#comfort-index"
              onClick={(e) => { setMobileMenuOpen(false); handleNavClick(e, 'comfort-index'); }}
              className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
            >
              Comfort Index
            </Link>
          </nav>
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mx-auto" />
            ) : user ? (
              <div className="space-y-3">
                {pathname !== '/dashboard' && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm transition-all"
                  >
                    Dashboard
                  </Link>
                )}
                <a
                  href="/auth/logout"
                  className="flex items-center justify-center w-full py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2 shrink-0" />
                  Sign Out
                </a>
              </div>
            ) : (
              <a
                href="/auth/login"
                className="flex items-center justify-center w-full py-3 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm transition-all"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
