/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseMusic } from '../models/ResponseMusic';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class MusicControllerService {

    /**
     * 新建音乐
     * @param title 
     * @param translateTitle 
     * @param artistList 
     * @param formData 
     * @returns ResponseMusic OK
     * @throws ApiError
     */
    public static addMusic(
title: string,
translateTitle?: string,
artistList?: Array<string>,
formData?: {
file: Blob;
},
): CancelablePromise<ResponseMusic> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music/add',
            query: {
                'title': title,
                'translateTitle': translateTitle,
                'artistList': artistList,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }

}
