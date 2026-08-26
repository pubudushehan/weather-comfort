import React from 'react';
import { LogOut, Sun } from 'lucide-react';

interface DashboardHeaderProps {
  userEmail: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userEmail }) => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 p-2 rounded-xl">
            <Sun className="w-5 h-5 shrink-0" />
          </div>
          <span className="font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight">
            WeatherComfort Analytics
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden sm:inline-block">
            {userEmail}
          </span>
          <a
            href="/auth/logout"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:text-zinc-300 text-zinc-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </a>
        </div>
      </div>
    </header>
  );
};
