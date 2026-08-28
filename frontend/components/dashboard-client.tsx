'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { DashboardHeader } from './dashboard-header';
import { WeatherCard } from './weather-card';
import { WeatherTable } from './weather-table';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { EmptyState } from './empty-state';
import { RefreshCw, Database, Clock, Info } from 'lucide-react';
import Image from 'next/image';
import logoImg from '../public/Logo.png';
import { TrendModal } from './trend-modal';

export default function DashboardClient() {
  const [trendCity, setTrendCity] = useState<{ id: number; name: string } | null>(null);
  const currentYear = new Date().getFullYear();
  // Query comfort weather data
  const {
    data: weatherData,
    isLoading: isWeatherLoading,
    error: weatherError,
    refetch: refetchWeather,
    isRefetching: isWeatherRefetching
  } = useQuery({
    queryKey: ['comfortWeather'],
    queryFn: apiClient.getComfortWeather,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 60 seconds
  });

  // Query cache status data
  const {
    data: cacheData,
    refetch: refetchCache,
  } = useQuery({
    queryKey: ['cacheStatus'],
    queryFn: apiClient.getCacheStatus,
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 seconds
  });

  const handleRefresh = async () => {
    await Promise.all([refetchWeather(), refetchCache()]);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <DashboardHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-44 pb-12 w-full space-y-8 select-none">
        {/* Dashboard Title Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Comfort Index Dashboard
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Last updated:{' '}
                  {weatherData?.generated_at
                    ? new Date(weatherData.generated_at).toLocaleTimeString()
                    : 'N/A'}
                </span>
              </span>
              <span>•</span>
              <span>Formula Version: {weatherData?.formula_version || 'v1'}</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isWeatherRefetching}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isWeatherRefetching ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Loading and Error States */}
        {isWeatherLoading && <LoadingState />}
        
        {weatherError && (
          <ErrorState
            message={weatherError instanceof Error ? weatherError.message : 'Unknown network failure.'}
            onRetry={handleRefresh}
          />
        )}

        {/* Content Render */}
        {!isWeatherLoading && !weatherError && weatherData && (
          <>
            {weatherData.failed_city_count > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-400 flex items-center gap-3">
                <Info className="w-5 h-5 shrink-0" />
                <span>
                  Notice: Failed to fetch weather parameters for {weatherData.failed_city_count} target cities.
                  Displaying comfort rankings for remaining {weatherData.city_count} cities.
                </span>
              </div>
            )}

            {weatherData.cities.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-10">
                {/* Top 3 Cities cards */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
                    Top Rated Cities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {weatherData.cities.slice(0, 3).map((city) => (
                      <WeatherCard 
                        key={city.city_id} 
                        city={city} 
                        onViewTrend={(id, name) => setTrendCity({ id, name })} 
                      />
                    ))}
                  </div>
                </div>

                {/* Cache Summary Status Banner */}
                {cacheData && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-zinc-400" />
                        Processed Cache Key
                      </div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono truncate">
                        {cacheData.processed_cache.key}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                        Processed Cache Status
                      </div>
                      <div className="text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          cacheData.processed_cache.status === 'HIT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {cacheData.processed_cache.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                        Processed Cache TTL
                      </div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {cacheData.processed_cache.ttl_seconds !== null
                          ? `${cacheData.processed_cache.ttl_seconds}s remaining`
                          : 'Expired/None'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                        Raw Weather Cache hitrate
                      </div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        Hits: {cacheData.raw_cache_summary.hits} / Misses: {cacheData.raw_cache_summary.misses}
                      </div>
                    </div>
                  </div>
                )}

                {/* Complete Rankings list */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
                    Full City Rankings
                  </h3>
                  <WeatherTable 
                    cities={weatherData.cities} 
                    onViewTrend={(id, name) => setTrendCity({ id, name })} 
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors mt-auto">
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
      {/* Trend Modal Overlay */}
      {trendCity && (
        <TrendModal
          cityId={trendCity.id}
          cityName={trendCity.name}
          onClose={() => setTrendCity(null)}
        />
      )}
    </div>
  );
}
