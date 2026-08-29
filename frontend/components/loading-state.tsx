import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-[320px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-1/2 h-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="w-1/3 h-4 bg-zinc-100 dark:bg-zinc-800/80 rounded" />
              <div className="w-1/4 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-4" />
            </div>
            <div className="space-y-2 mt-6">
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="w-full h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-full h-8 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
        ))}
      </div>
    </div>
  );
};
