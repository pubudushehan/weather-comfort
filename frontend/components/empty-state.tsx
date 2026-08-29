import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = "No cities available in database." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-center max-w-xl mx-auto w-full my-8">
      <Inbox className="w-12 h-12 text-zinc-400 mb-4 shrink-0" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">No data found</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{message}</p>
    </div>
  );
};
