import React from 'react';
import Image from 'next/image';
import logoImg from '../public/Logo.png';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Image
            src={logoImg}
            alt="WeatherComfort Analytics Logo"
            width={24}
            height={24}
            className="object-contain rounded"
          />
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            WeatherComfort Analytics
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm text-center md:text-left leading-normal">
          Real-time multi-city comfort analysis and index ranking pipeline, engineered securely on the backend.
        </p>

        <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          <span>© {currentYear} WeatherComfort Analytics. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
