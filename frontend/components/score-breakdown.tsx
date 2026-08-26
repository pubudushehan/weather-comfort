import React from 'react';
import { ScoreBreakdown as ScoreBreakdownType } from '../lib/api-client';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ breakdown }) => {
  const items = [
    { label: "Temperature", val: breakdown.temperature, color: "bg-orange-500" },
    { label: "Humidity", val: breakdown.humidity, color: "bg-blue-500" },
    { label: "Wind Speed", val: breakdown.wind, color: "bg-teal-500" },
    { label: "Cloudiness", val: breakdown.cloudiness, color: "bg-indigo-500" },
  ];

  if (breakdown.visibility !== undefined && breakdown.visibility !== null) {
    items.push({ label: "Visibility", val: breakdown.visibility, color: "bg-purple-500" });
  }

  return (
    <div className="space-y-3 w-full">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{item.label}</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{item.val.toFixed(1)}/100</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color}`}
              style={{ width: `${item.val}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
