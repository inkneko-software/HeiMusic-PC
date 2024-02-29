/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseListMusicVo } from '../models/ResponseListMusicVo';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class SearchControllerService {

    /**
     * @param prompt 
     * @returns ResponseListMusicVo OK
     * @throws ApiError
     */
    public static searchMusic(
prompt: string,
): CancelablePromise<ResponseListMusicVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/search/searchMusic',
            query: {
                'prompt': prompt,
            },
        });
    }

}
