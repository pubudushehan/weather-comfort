import React from 'react';
import clsx from 'clsx';

interface ScoreBadgeProps {
  score: number;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let label = "Less Comfortable";
  let colorClasses = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";

  if (score >= 80) {
    label = "Excellent";
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
  } else if (score >= 60) {
    label = "Good";
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
  }

  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
      colorClasses
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      <span className="font-mono">{score.toFixed(2)}</span>
      <span className="opacity-80">({label})</span>
    </span>
  );
};
