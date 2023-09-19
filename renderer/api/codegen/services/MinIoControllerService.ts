/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseString } from '../models/ResponseString';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class MinIoControllerService {

    /**
     * 获取上传授权链接
     * @returns ResponseString OK
     * @throws ApiError
     */
    public static generateUploadUrl(): CancelablePromise<ResponseString> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/minio/getUploadLink',
        });
    }

}
