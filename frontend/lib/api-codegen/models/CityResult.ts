/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScoreBreakdown } from './ScoreBreakdown';
import type { WeatherDetails } from './WeatherDetails';
export type CityResult = {
    /**
     * Predefined city numeric ID
     */
    city_id: number;
    /**
     * Name of the city
     */
    city_name: string;
    /**
     * Two-letter country code
     */
    country: string;
    /**
     * City rank based on overall comfort score (starting at 1)
     */
    rank: number;
    /**
     * Custom Comfort Index score (0.00 - 100.00)
     */
    comfort_score: number;
    weather: WeatherDetails;
    score_breakdown: ScoreBreakdown;
};

