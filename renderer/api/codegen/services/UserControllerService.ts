/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseUserDetailVo } from '../models/ResponseUserDetailVo';
import type { UpdateUserInfoDto } from '../models/UpdateUserInfoDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class UserControllerService {

    /**
     * 更新用户资料
     * 用户名/生日/性别/个性签名为全量更新，字段传null视为清空（个性签名清空为空串）
     * @param requestBody 
     * @returns ResponseUserDetailVo OK
     * @throws ApiError
     */
    public static updateUserInfo(
requestBody: UpdateUserInfoDto,
): CancelablePromise<ResponseUserDetailVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user/updateUserInfo',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 更新用户头像
     * 按文件实际内容校验类型，仅支持 JPEG/PNG/WebP/GIF，最大10MB
     * @param formData 
     * @returns ResponseUserDetailVo OK
     * @throws ApiError
     */
    public static updateAvatar(
formData?: {
avatar: Blob;
},
): CancelablePromise<ResponseUserDetailVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user/updateAvatar',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }

    /**
     * 获取导航信息
     * 在已登录状态下返回当前用户信息
     * @returns ResponseUserDetailVo OK
     * @throws ApiError
     */
    public static nav(): CancelablePromise<ResponseUserDetailVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user/nav',
        });
    }

}
