/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseListPlayHistoryVo } from '../models/ResponseListPlayHistoryVo';
import type { ResponseObject } from '../models/ResponseObject';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PlayHistoryControllerService {

    /**
     * 上报一次播放
     * 实际开始播放时调用；首次插入记录，之后播放次数+1并刷新最近播放时间
     * @param musicId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static report(
musicId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playHistory/report',
            query: {
                'musicId': musicId,
            },
        });
    }

    /**
     * 删除单条播放历史
     * @param musicId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removeHistory(
musicId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playHistory/removeHistory',
            query: {
                'musicId': musicId,
            },
        });
    }

    /**
     * 查询最近播放列表
     * 按最近播放时间倒序
     * @param limit 
     * @returns ResponseListPlayHistoryVo OK
     * @throws ApiError
     */
    public static getRecentList(
limit: number = 100,
): CancelablePromise<ResponseListPlayHistoryVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playHistory/getRecentList',
            query: {
                'limit': limit,
            },
        });
    }

    /**
     * 查询最常播放列表
     * 按播放次数倒序，并列时按最近播放时间倒序
     * @param limit 
     * @returns ResponseListPlayHistoryVo OK
     * @throws ApiError
     */
    public static getMostPlayedList(
limit: number = 100,
): CancelablePromise<ResponseListPlayHistoryVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playHistory/getMostPlayedList',
            query: {
                'limit': limit,
            },
        });
    }

}
