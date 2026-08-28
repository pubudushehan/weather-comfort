'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { X, RefreshCw, AlertTriangle, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendModalProps {
  cityId: number | null;
  cityName: string;
  onClose: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      timestamp_utc: string;
      temperature_c: number;
    };
  }>;
}

// Custom tooltip component defined outside render to satisfy react-hooks/static-components
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    const formattedTime = new Date(point.timestamp_utc).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-lg text-xs outline-none">
        <p className="font-semibold text-zinc-400 dark:text-zinc-500 mb-1">{formattedTime}</p>
        <p className="font-bold text-zinc-900 dark:text-zinc-50">
          Temp: <span className="text-sky-600 dark:text-sky-400">{point.temperature_c.toFixed(1)}°C</span>
        </p>
      </div>
    );
  }
  return null;
};

export const TrendModal: React.FC<TrendModalProps> = ({ cityId, cityName, onClose }) => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatches from Recharts SSR
  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Query forecast trend on demand
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['temperatureTrend', cityId],
    queryFn: () => apiClient.getTemperatureTrend(cityId!),
    enabled: cityId !== null,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 60 seconds stale time
  });

  if (cityId === null || !mounted) return null;

  // X-Axis time formatting: e.g. "9 AM"
  const formatXAxis = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    } catch {
      return tickItem;
    }
  };

  // Min and Max calculations
  const getMinMaxTemps = () => {
    if (!data || !data.forecast_points || data.forecast_points.length === 0) return { min: 0, max: 0 };
    const temps = data.forecast_points.map((pt) => pt.temperature_c);
    return {
      min: Math.min(...temps),
      max: Math.max(...temps)
    };
  };

  const { min: minTemp, max: maxTemp } = getMinMaxTemps();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              <span>{cityName} Temperature Trend</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Temperature forecast for next 24 hours <span className="mx-1">•</span> 3-hour intervals
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-3 border-zinc-200 dark:border-zinc-800 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading forecast data...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-6 rounded-xl text-center space-y-4 max-w-md mx-auto">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <div>
                <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm">Failed to load forecast</h4>
                <p className="text-xs text-rose-600 dark:text-rose-500 mt-1 leading-normal">
                  {error instanceof Error ? error.message : 'Weather service error.'}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          ) : data && (!data.forecast_points || data.forecast_points.length === 0) ? (
            <div className="text-center py-12 space-y-2">
              <AlertTriangle className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">No forecast details found</h4>
              <p className="text-xs text-zinc-500">There are no temperature forecast points currently available for {cityName}.</p>
            </div>
          ) : data ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/80 rounded-xl">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xs text-zinc-400 font-bold uppercase tracking-wider">Minimum Temp</div>
                    <div className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{minTemp.toFixed(1)}°C</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/80 rounded-xl">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xs text-zinc-400 font-bold uppercase tracking-wider">Maximum Temp</div>
                    <div className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{maxTemp.toFixed(1)}°C</div>
                  </div>
                </div>
              </div>

              {/* Line Chart */}
              <div className="w-full h-[260px] bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800/50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.forecast_points}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.12)" />
                    <XAxis
                      dataKey="timestamp_utc"
                      tickFormatter={formatXAxis}
                      stroke="rgba(128,128,128,0.4)"
                      tickLine={false}
                      style={{ fontSize: '10px', fontFamily: 'monospace' }}
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(128,128,128,0.4)"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '10px', fontFamily: 'monospace' }}
                      domain={['auto', 'auto']}
                      dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="temperature_c"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0284c7', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#0284c7', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Cache Telemetry Metadata Footer */}
              <div className="text-3xs text-zinc-400 dark:text-zinc-500 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50 pt-3 mt-2 font-mono">
                <span>GENERATED: {new Date(data.generated_at).toLocaleString()}</span>
                <span>CACHE STATUS: <strong className={data.cache.status === 'HIT' ? 'text-emerald-500' : 'text-amber-500'}>{data.cache.status}</strong> {data.cache.ttl_seconds !== null ? `(${data.cache.ttl_seconds}s TTL)` : ''}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
