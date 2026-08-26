export interface WeatherDetails {
  description: string;
  temperature_c: number;
  humidity: number;
  pressure_hpa: number;
  wind_speed_mps: number;
  cloudiness_percent: number;
  visibility_km: number;
}

export interface ScoreBreakdown {
  temperature: number;
  humidity: number;
  wind: number;
  cloudiness: number;
  visibility?: number | null;
}

export interface CityResult {
  city_id: number;
  city_name: string;
  country: string;
  rank: number;
  comfort_score: number;
  weather: WeatherDetails;
  score_breakdown: ScoreBreakdown;
}

export interface CacheSummary {
  processed: string;
  raw_hits: number;
  raw_misses: number;
}

export interface ComfortWeatherResponse {
  generated_at: string;
  formula_version: string;
  city_count: number;
  failed_city_count: number;
  cache: CacheSummary;
  cities: CityResult[];
}

export interface ProcessedCacheStatus {
  key: string;
  status: string;
  ttl_seconds: number | null;
}

export interface RawCacheSummary {
  hits: number;
  misses: number;
}

export interface CacheStatusResponse {
  processed_cache: ProcessedCacheStatus;
  raw_cache_summary: RawCacheSummary;
}

export class APIError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || `API error: ${status}`);
    this.status = status;
    this.detail = detail || `API error: ${status}`;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || data.message || JSON.stringify(data);
    } catch {
      detail = `Request failed with status ${res.status}`;
    }
    throw new APIError(res.status, detail);
  }
  return res.json();
}

export const apiClient = {
  async getComfortWeather(): Promise<ComfortWeatherResponse> {
    const res = await fetch('/api/weather/comfort');
    return handleResponse<ComfortWeatherResponse>(res);
  },

  async getCacheStatus(): Promise<CacheStatusResponse> {
    const res = await fetch('/api/cache/status');
    return handleResponse<CacheStatusResponse>(res);
  }
};
