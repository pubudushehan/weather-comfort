import React from 'react';
import { CityResult } from '../lib/api-client';
import { ScoreBadge } from './score-badge';
import { ScoreBreakdown } from './score-breakdown';
import { Thermometer, Droplets, Wind, Cloud } from 'lucide-react';

interface WeatherCardProps {
  city: CityResult;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ city }) => {
  return (
    <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      {/* Rank Indicator Badge */}
      <div className="absolute top-0 right-0 bg-zinc-900 text-white dark:bg-zinc-800 px-4 py-1.5 rounded-bl-xl font-bold text-sm tracking-wide">
        Rank #{city.rank}
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-baseline gap-1">
            {city.city_name}
            <span className="text-xs font-semibold text-zinc-400 uppercase">{city.country}</span>
          </h3>
          <p className="text-sm text-zinc-500 capitalize">{city.weather.description}</p>
        </div>

        {/* Comfort Score Dot */}
        <div className="mb-5">
          <ScoreBadge score={city.comfort_score} />
        </div>

        {/* Standard Weather Parameters Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs">
            <Thermometer className="w-4 h-4 text-orange-500 shrink-0" />
            <div>
              <div className="text-zinc-400 font-medium">Temperature</div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{city.weather.temperature_c.toFixed(1)}°C</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs">
            <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <div className="text-zinc-400 font-medium">Humidity</div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{city.weather.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs">
            <Wind className="w-4 h-4 text-teal-500 shrink-0" />
            <div>
              <div className="text-zinc-400 font-medium">Wind Speed</div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{city.weather.wind_speed_mps.toFixed(1)} m/s</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs">
            <Cloud className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <div className="text-zinc-400 font-medium">Cloudiness</div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{city.weather.cloudiness_percent}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comfort Components Breakdown */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Comfort Breakdown</h4>
        <ScoreBreakdown breakdown={city.score_breakdown} />
      </div>
    </div>
  );
};
