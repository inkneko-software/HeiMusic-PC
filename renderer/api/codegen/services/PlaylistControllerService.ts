/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseListMusicVo } from '../models/ResponseListMusicVo';
import type { ResponseObject } from '../models/ResponseObject';
import type { ResponsePlaylist } from '../models/ResponsePlaylist';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PlaylistControllerService {

    /**
     * 取消收藏音乐
     * @param musicId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removeMusicFavorite(
musicId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/removeMusicFavorite',
            query: {
                'musicId': musicId,
            },
        });
    }

    /**
     * 创建歌单
     * @returns ResponsePlaylist OK
     * @throws ApiError
     */
    public static addPlaylist(): CancelablePromise<ResponsePlaylist> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/addPlaylist',
        });
    }

    /**
     * 收藏音乐
     * @param musicId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static addMusicFavorite(
musicId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/addMusicFavorite',
            query: {
                'musicId': musicId,
            },
        });
    }

    /**
     * 查询用户收藏的音乐
     * @returns ResponseListMusicVo OK
     * @throws ApiError
     */
    public static getMyFavoriteMusicList(): CancelablePromise<ResponseListMusicVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playlist/getMyFavoriteMusicList',
        });
    }

}
