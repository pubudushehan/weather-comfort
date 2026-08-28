/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CacheSummary } from './CacheSummary';
import type { CityResult } from './CityResult';
export type ComfortWeatherResponse = {
    /**
     * ISO 8601 UTC timestamp when response was generated
     */
    generated_at: string;
    /**
     * Comfort score formula version (e.g. v1, v2)
     */
    formula_version: string;
    /**
     * Number of cities successfully processed
     */
    city_count: number;
    /**
     * Number of cities that failed during fetching
     */
    failed_city_count: number;
    cache: CacheSummary;
    /**
     * List of ranked city comfort scores
     */
    cities: Array<CityResult>;
};

