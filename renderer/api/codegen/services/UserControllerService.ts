/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseUserDetail } from '../models/ResponseUserDetail';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class UserControllerService {

    /**
     * 获取导航信息
     * 在已登录状态下返回当前用户信息
     * @returns ResponseUserDetail OK
     * @throws ApiError
     */
    public static nav(): CancelablePromise<ResponseUserDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user/nav',
        });
    }

}
