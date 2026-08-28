/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScoreBreakdown = {
    /**
     * Comfort score component for temperature (0-100)
     */
    temperature: number;
    /**
     * Comfort score component for humidity (0-100)
     */
    humidity: number;
    /**
     * Comfort score component for wind speed (0-100)
     */
    wind: number;
    /**
     * Comfort score component for cloudiness (0-100)
     */
    cloudiness: number;
    /**
     * Optional comfort score component for visibility (0-100)
     */
    visibility?: (number | null);
};

