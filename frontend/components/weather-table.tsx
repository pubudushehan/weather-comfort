import React from 'react';
import { CityResult } from '../lib/api-client';
import { ScoreBadge } from './score-badge';
import { ScoreBreakdown } from './score-breakdown';
import { TrendingUp } from 'lucide-react';

interface WeatherTableProps {
  cities: CityResult[];
  onViewTrend: (cityId: number, cityName: string) => void;
}

export const WeatherTable: React.FC<WeatherTableProps> = ({ cities, onViewTrend }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">Comfort Score</th>
              <th className="px-6 py-4">Condition</th>
              <th className="px-6 py-4 hidden sm:table-cell">Details</th>
              <th className="px-6 py-4 hidden lg:table-cell">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {cities.map((city) => (
              <tr key={city.city_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-zinc-900 dark:text-zinc-50">
                  #{city.rank}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{city.city_name}</div>
                  <div className="text-xs text-zinc-400 uppercase font-medium">{city.country}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <ScoreBadge score={city.comfort_score} /><br /><br />
                    <button
                      onClick={() => onViewTrend(city.city_id, city.city_name)}
                      className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-2xs font-semibold transition-all active:scale-98 cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <TrendingUp className="w-3 h-3 text-sky-500" />
                      <span>Trend</span>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize text-zinc-600 dark:text-zinc-300">
                  {city.weather.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>Temp: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{city.weather.temperature_c.toFixed(1)}°C</span></div>
                    <div>Humidity: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{city.weather.humidity}%</span></div>
                    <div>Wind: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{city.weather.wind_speed_mps.toFixed(1)} m/s</span></div>
                    <div>Clouds: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{city.weather.cloudiness_percent}%</span></div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell min-w-[200px]">
                  <ScoreBreakdown breakdown={city.score_breakdown} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
