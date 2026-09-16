/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddPlaylistMusicDto } from '../models/AddPlaylistMusicDto';
import type { RemovePlaylistMusicDto } from '../models/RemovePlaylistMusicDto';
import type { ResponseListMusicVo } from '../models/ResponseListMusicVo';
import type { ResponseListPlaylistVo } from '../models/ResponseListPlaylistVo';
import type { ResponseObject } from '../models/ResponseObject';
import type { ResponsePlaylist } from '../models/ResponsePlaylist';
import type { ResponsePlaylistVo } from '../models/ResponsePlaylistVo';
import type { UpdatePlaylistInfoDto } from '../models/UpdatePlaylistInfoDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PlaylistControllerService {

    /**
     * 更新歌单信息
     * @param dto 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static updatePlaylistInfo(
dto: UpdatePlaylistInfoDto,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/updatePlaylistInfo',
            query: {
                'dto': dto,
            },
        });
    }

    /**
     * 收藏歌单
     * @param requestBody 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static subscribePlaylist(
requestBody: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/subscribePlaylist',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 删除歌单
     * @param playlistId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removePlaylist(
playlistId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/removePlaylist',
            query: {
                'playlistId': playlistId,
            },
        });
    }

    /**
     * 查询已收藏的歌单
     * @returns ResponseListPlaylistVo OK
     * @throws ApiError
     */
    public static getPlaylistSubscriptionList(): CancelablePromise<ResponseListPlaylistVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playlist/removePlaylistSubscription',
        });
    }

    /**
     * 取消收藏歌单
     * @param requestBody 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removePlaylistSubscription(
requestBody: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/removePlaylistSubscription',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 删除歌单中的音乐
     * @param requestBody 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removePlaylistMusic(
requestBody: RemovePlaylistMusicDto,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/removePlaylistMusic',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

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
     * @param title 
     * @param description 
     * @returns ResponsePlaylist OK
     * @throws ApiError
     */
    public static addPlaylist(
title: string,
description: string,
): CancelablePromise<ResponsePlaylist> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/addPlaylist',
            query: {
                'title': title,
                'description': description,
            },
        });
    }

    /**
     * 向歌单添加音乐
     * @param requestBody 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static addPlaylistMusic(
requestBody: AddPlaylistMusicDto,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/playlist/addPlaylistMusic',
            body: requestBody,
            mediaType: 'application/json',
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
     * 查询已创建的歌单
     * @returns ResponseListPlaylistVo OK
     * @throws ApiError
     */
    public static getCreatedPlaylistInfo(): CancelablePromise<ResponseListPlaylistVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playlist/getUserCreatedPlaylist',
        });
    }

    /**
     * 查询歌单音乐
     * @param playlistId 
     * @returns ResponseListMusicVo OK
     * @throws ApiError
     */
    public static getPlaylistMusicList(
playlistId: number,
): CancelablePromise<ResponseListMusicVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playlist/getPlaylistMusicList',
            query: {
                'playlistId': playlistId,
            },
        });
    }

    /**
     * 查询歌单信息
     * @param playlistId 
     * @returns ResponsePlaylistVo OK
     * @throws ApiError
     */
    public static getPlaylistInfo(
playlistId: number,
): CancelablePromise<ResponsePlaylistVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/playlist/getPlaylistInfo',
            query: {
                'playlistId': playlistId,
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
