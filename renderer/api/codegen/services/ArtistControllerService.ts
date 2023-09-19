/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseArtistVo } from '../models/ResponseArtistVo';
import type { ResponseListArtistVo } from '../models/ResponseListArtistVo';
import type { ResponseObject } from '../models/ResponseObject';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ArtistControllerService {

    /**
     * 更新艺术家信息
     * @param artistId 
     * @param name 
     * @param translateName 
     * @param avatarUrl 
     * @param birth 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static updateArtist(
artistId: number,
name?: string,
translateName?: string,
avatarUrl?: string,
birth?: string,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/artist/update',
            query: {
                'artistId': artistId,
                'name': name,
                'translateName': translateName,
                'avatarUrl': avatarUrl,
                'birth': birth,
            },
        });
    }

    /**
     * 添加艺术家
     * 通过名称，添加艺术家
     * @param name 
     * @param translateName 
     * @param avatarUrl 
     * @param birth 
     * @returns ResponseArtistVo OK
     * @throws ApiError
     */
    public static addArtist(
name: string,
translateName?: string,
avatarUrl?: string,
birth?: string,
): CancelablePromise<ResponseArtistVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/artist/add',
            query: {
                'name': name,
                'translateName': translateName,
                'avatarUrl': avatarUrl,
                'birth': birth,
            },
        });
    }

    /**
     * 模糊匹配艺术家名称
     * @param name 
     * @param page 
     * @param num 
     * @returns ResponseListArtistVo OK
     * @throws ApiError
     */
    public static searchArtist(
name: string,
page: number = 1,
num: number = 10,
): CancelablePromise<ResponseListArtistVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/artist/search',
            query: {
                'name': name,
                'page': page,
                'num': num,
            },
        });
    }

    /**
     * 查询名称全匹配的艺术家
     * @param name 
     * @returns ResponseArtistVo OK
     * @throws ApiError
     */
    public static getArtistByName(
name: string,
): CancelablePromise<ResponseArtistVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/artist/getByName',
            query: {
                'name': name,
            },
        });
    }

    /**
     * 查询对应id的艺术家
     * @param id 
     * @returns ResponseArtistVo OK
     * @throws ApiError
     */
    public static getArtistByid(
id: number,
): CancelablePromise<ResponseArtistVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/artist/getById',
            query: {
                'id': id,
            },
        });
    }

}
