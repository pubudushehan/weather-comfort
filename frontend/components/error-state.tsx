import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-red-100 dark:border-red-950/40 rounded-2xl bg-red-50/30 dark:bg-red-950/10 text-center max-w-xl mx-auto w-full my-8">
      <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-4 shrink-0" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Failed to load weather data</h3>
      <p className="text-sm text-red-600 dark:text-red-400 mb-6 font-medium max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
