/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProcessedCacheStatus = {
    /**
     * Redis key used for processed cache storage
     */
    key: string;
    /**
     * Processed cache status (e.g., HIT, MISS)
     */
    status: string;
    /**
     * Time to live in seconds
     */
    ttl_seconds?: (number | null);
};

