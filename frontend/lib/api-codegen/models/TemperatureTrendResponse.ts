/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForecastPoint } from './ForecastPoint';
import type { TrendCacheInfo } from './TrendCacheInfo';
export type TemperatureTrendResponse = {
    /**
     * Predefined city numeric ID
     */
    city_id: number;
    /**
     * Name of the city
     */
    city_name: string;
    /**
     * Forecast data resolution in hours
     */
    source_interval_hours?: number;
    /**
     * List of forecast temperature data points
     */
    forecast_points: Array<ForecastPoint>;
    /**
     * ISO 8601 UTC timestamp when response was generated
     */
    generated_at: string;
    /**
     * Cache information
     */
    cache: TrendCacheInfo;
};

