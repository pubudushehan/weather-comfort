/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CacheStatusResponse } from '../models/CacheStatusResponse';
import type { ComfortWeatherResponse } from '../models/ComfortWeatherResponse';
import type { HealthResponse } from '../models/HealthResponse';
import type { TemperatureTrendResponse } from '../models/TemperatureTrendResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Health
     * @returns HealthResponse Successful Response
     * @throws ApiError
     */
    public getHealthHealthGet(): CancelablePromise<HealthResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Get Comfort Weather
     * @returns ComfortWeatherResponse Successful Response
     * @throws ApiError
     */
    public getComfortWeatherApiV1WeatherComfortGet(): CancelablePromise<ComfortWeatherResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/weather/comfort',
        });
    }
    /**
     * Get Temperature Trend
     * @param cityId
     * @returns TemperatureTrendResponse Successful Response
     * @throws ApiError
     */
    public getTemperatureTrendApiV1WeatherCitiesCityIdTemperatureTrendGet(
        cityId: number,
    ): CancelablePromise<TemperatureTrendResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/weather/cities/{city_id}/temperature-trend',
            path: {
                'city_id': cityId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Cache Status
     * @returns CacheStatusResponse Successful Response
     * @throws ApiError
     */
    public getCacheStatusApiV1CacheStatusGet(): CancelablePromise<CacheStatusResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/cache/status',
        });
    }
}
