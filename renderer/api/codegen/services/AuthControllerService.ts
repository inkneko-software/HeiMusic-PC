/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRootAccountDto } from '../models/CreateRootAccountDto';
import type { LoginDto } from '../models/LoginDto';
import type { Response } from '../models/Response';
import type { ResponseIsExistsRootAccountVo } from '../models/ResponseIsExistsRootAccountVo';
import type { ResponseObject } from '../models/ResponseObject';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AuthControllerService {

    /**
     * @param email 
     * @returns Response OK
     * @throws ApiError
     */
    public static sendRegisterEmail(
email: string,
): CancelablePromise<Response> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/sendRegisterEmail',
            query: {
                'email': email,
            },
        });
    }

    /**
     * @param email 
     * @returns Response OK
     * @throws ApiError
     */
    public static sendPasswordResetEmailCode(
email?: string,
): CancelablePromise<Response> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/sendPasswordResetEmailCode',
            query: {
                'email': email,
            },
        });
    }

    /**
     * @param email 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static sendLoginEmailCode(
email: string,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/sendLoginEmailCode',
            query: {
                'email': email,
            },
        });
    }

    /**
     * 重置密码
     * 在已登录状态下重置密码。需提供邮箱验证码
     * @param password 密码
     * @param emailCode 邮箱验证码
     * @returns Response OK
     * @throws ApiError
     */
    public static resetPassword(
password: string,
emailCode: string,
): CancelablePromise<Response> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/resetPassword',
            query: {
                'password': password,
                'emailCode': emailCode,
            },
        });
    }

    /**
     * @param email 
     * @param code 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static register(
email: string,
code: string,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            query: {
                'email': email,
                'code': code,
            },
        });
    }

    /**
     * 退出当前登录
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static logout(): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/logout',
        });
    }

    /**
     * 登录
     * 使用验证码或密码登录，登录成功会setCookie，包括userId与sessionId两个字段
     * @param requestBody 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static login(
requestBody: LoginDto,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param email 
     * @returns Response OK
     * @throws ApiError
     */
    public static isEmailRegistered(
email: string,
): CancelablePromise<Response> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/isEmailRegistered',
            query: {
                'email': email,
            },
        });
    }

    /**
     * 创建唯一管理账户
     * @param requestBody 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static createRootAccount(
requestBody: CreateRootAccountDto,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/createRootAccount',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 检查是否存在管理账户
     * @returns ResponseIsExistsRootAccountVo OK
     * @throws ApiError
     */
    public static isExistsRootAccount(): CancelablePromise<ResponseIsExistsRootAccountVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/isExistsRootAccount',
        });
    }

}
