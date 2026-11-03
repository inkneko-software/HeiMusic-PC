/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseListMusicVo } from '../models/ResponseListMusicVo';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class RecommendControllerService {

    /**
     * 同口味推荐
     * 与最常播放曲目同专辑/同歌手的未听曲目加权随机抽取（同专辑权重更高）；无历史或候选已听尽返回空列表，前端可回落随机播放
     * @param limit 
     * @returns ResponseListMusicVo OK
     * @throws ApiError
     */
    public static similar(
limit: number = 30,
): CancelablePromise<ResponseListMusicVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/recommend/similar',
            query: {
                'limit': limit,
            },
        });
    }

    /**
     * 久未重现推荐
     * 以前常听（播放次数≥3）但近N天未播放的曲目，按播放次数倒序；无满足条件的历史返回空列表，前端可回落每日30首/随机播放
     * @param days 
     * @param limit 
     * @returns ResponseListMusicVo OK
     * @throws ApiError
     */
    public static forgotten(
days: number = 90,
limit: number = 30,
): CancelablePromise<ResponseListMusicVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/recommend/forgotten',
            query: {
                'days': days,
                'limit': limit,
            },
        });
    }

}
