import { WeatherComfortClient } from './api-codegen';
import type {
  ComfortWeatherResponse,
  CacheStatusResponse,
  TemperatureTrendResponse,
  CityResult,
  ScoreBreakdown,
  WeatherDetails
} from './api-codegen';

// Re-export type definitions so that existing imports across frontend components remain unbroken
export type {
  ComfortWeatherResponse,
  CacheStatusResponse,
  TemperatureTrendResponse,
  CityResult,
  ScoreBreakdown,
  WeatherDetails
};

const clientInstance = new WeatherComfortClient();

export const apiClient = {
  async getComfortWeather(): Promise<ComfortWeatherResponse> {
    return clientInstance.default.getComfortWeatherApiV1WeatherComfortGet();
  },

  async getCacheStatus(): Promise<CacheStatusResponse> {
    return clientInstance.default.getCacheStatusApiV1CacheStatusGet();
  },

  async getTemperatureTrend(cityId: number): Promise<TemperatureTrendResponse> {
    return clientInstance.default.getTemperatureTrendApiV1WeatherCitiesCityIdTemperatureTrendGet(cityId);
  }
};
