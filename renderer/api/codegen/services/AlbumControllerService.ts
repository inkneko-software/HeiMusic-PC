/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseAlbumListVo } from '../models/ResponseAlbumListVo';
import type { ResponseAlbumVo } from '../models/ResponseAlbumVo';
import type { ResponseListAlbumVo } from '../models/ResponseListAlbumVo';
import type { ResponseListMusicVo } from '../models/ResponseListMusicVo';
import type { ResponseObject } from '../models/ResponseObject';
import type { UpdateAlbumInfoDto } from '../models/UpdateAlbumInfoDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AlbumControllerService {

    /**
     * 更改专辑基础信息
     * @param formData 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static updateAlbumInfo(
formData?: UpdateAlbumInfoDto,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/album/updateAlbumInfo',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }

    /**
     * 删除专辑
     * @param albumId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removeAlbum(
albumId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/album/removeAlbum',
            query: {
                'albumId': albumId,
            },
        });
    }

    /**
     * 添加专辑
     * @param title 
     * @param translateTitle 
     * @param artistList 
     * @param formData 
     * @returns ResponseAlbumVo OK
     * @throws ApiError
     */
    public static addAlbum(
title: string,
translateTitle?: string,
artistList?: Array<number>,
formData?: {
frontCover?: Blob;
},
): CancelablePromise<ResponseAlbumVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/album/add',
            query: {
                'title': title,
                'translateTitle': translateTitle,
                'artistList': artistList,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }

    /**
     * 向专辑添加音乐
     * @param albumId 
     * @param musicIds 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static addAlbumMusic(
albumId: number,
musicIds: Array<number>,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/album/addMusic',
            query: {
                'albumId': albumId,
                'musicIds': musicIds,
            },
        });
    }

    /**
     * 查询专辑基础信息
     * @param albumId 
     * @returns ResponseAlbumVo OK
     * @throws ApiError
     */
    public static getAlbum(
albumId: number,
): CancelablePromise<ResponseAlbumVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/album/get',
            query: {
                'albumId': albumId,
            },
        });
    }

    /**
     * 查询最新上传的专辑，默认10个
     * @param current 
     * @param size 
     * @returns ResponseListAlbumVo OK
     * @throws ApiError
     */
    public static getRecentUpload(
current: number = 1,
size: number = 10,
): CancelablePromise<ResponseListAlbumVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/album/getRecentUpload',
            query: {
                'current': current,
                'size': size,
            },
        });
    }

    /**
     * 查询专辑音乐列表
     * @param albumId 
     * @returns ResponseListMusicVo OK
     * @throws ApiError
     */
    public static getAlbumMusicList(
albumId: number,
): CancelablePromise<ResponseListMusicVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/album/getMusicList',
            query: {
                'albumId': albumId,
            },
        });
    }

    /**
     * 查询已上传专辑
     * @param page 
     * @param size 
     * @returns ResponseAlbumListVo OK
     * @throws ApiError
     */
    public static getAlbumList(
page: number = 1,
size: number = 10,
): CancelablePromise<ResponseAlbumListVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/album/getAlbumList',
            query: {
                'page': page,
                'size': size,
            },
        });
    }

}
