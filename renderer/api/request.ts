/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * openapi-typescript-codegen 的自定义 request 模板（package.json 的 `--request` 参数）。
 * 每次 `npm run openapi` 会被原样复制到 renderer/api/codegen/core/request.ts，
 * 因此 import 必须使用对模板位置（renderer/api/）与生成位置（renderer/api/codegen/core/）
 * 都成立的 alias 路径。
 */

import { ApiError } from '@api/codegen/core/ApiError';
import type { ApiRequestOptions } from '@api/codegen/core/ApiRequestOptions';
import type { ApiResult } from '@api/codegen/core/ApiResult';
import { CancelablePromise } from '@api/codegen/core/CancelablePromise';
import type { OnCancel } from '@api/codegen/core/CancelablePromise';
import type { OpenAPIConfig } from '@api/codegen/core/OpenAPI';
import { pushToast } from '@components/HeiMusicMainLayout';

import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { ensureNativeApiBase } from '@api/../lib/apiServer';
import { ensureApiBase } from '@api/../lib/mediaUrl';

const isDefined = <T>(value: T | null | undefined): value is Exclude<T, null | undefined> => {
    return value !== undefined && value !== null;
};

const isString = (value: any): value is string => {
    return typeof value === 'string';
};

const isStringWithValue = (value: any): value is string => {
    return isString(value) && value !== '';
};

const isBlob = (value: any): value is Blob => {
    return (
        typeof value === 'object' &&
        typeof value.type === 'string' &&
        typeof value.stream === 'function' &&
        typeof value.arrayBuffer === 'function' &&
        typeof value.constructor === 'function' &&
        typeof value.constructor.name === 'string' &&
        /^(Blob|File)$/.test(value.constructor.name) &&
        /^(Blob|File)$/.test(value[Symbol.toStringTag])
    );
};

const isFormData = (value: any): value is FormData => {
    return value instanceof FormData;
};

const base64 = (str: string): string => {
    try {
        return btoa(str);
    } catch (err) {
        // @ts-ignore
        return Buffer.from(str).toString('base64');
    }
};

const getQueryString = (params: Record<string, any>): string => {
    const qs: string[] = [];

    const append = (key: string, value: any) => {
        qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    };

    const process = (key: string, value: any) => {
        if (isDefined(value)) {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    process(key, v);
                });
            } else if (typeof value === 'object') {
                Object.entries(value).forEach(([k, v]) => {
                    process(`${key}[${k}]`, v);
                });
            } else {
                append(key, value);
            }
        }
    };

    Object.entries(params).forEach(([key, value]) => {
        process(key, value);
    });

    if (qs.length > 0) {
        return `?${qs.join('&')}`;
    }

    return '';
};

const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
    const encoder = config.ENCODE_PATH || encodeURI;

    const path = options.url
        .replace('{api-version}', config.VERSION)
        .replace(/{(.*?)}/g, (substring: string, group: string) => {
            if (options.path?.hasOwnProperty(group)) {
                return encoder(String(options.path[group]));
            }
            return substring;
        });

    const url = `${config.BASE}${path}`;
    if (options.query) {
        return `${url}${getQueryString(options.query)}`;
    }
    return url;
};

const getFormData = (options: ApiRequestOptions): FormData | undefined => {
    if (options.formData) {
        const formData = new FormData();

        const process = (key: string, value: any) => {
            if (isString(value) || isBlob(value)) {
                formData.append(key, value);
            } else {
                formData.append(key, JSON.stringify(value));
            }
        };

        Object.entries(options.formData)
            .filter(([_, value]) => isDefined(value))
            .forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => process(key, v));
                } else {
                    process(key, value);
                }
            });

        return formData;
    }
    return undefined;
};

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;

const resolve = async <T>(options: ApiRequestOptions, resolver?: T | Resolver<T>): Promise<T | undefined> => {
    if (typeof resolver === 'function') {
        return (resolver as Resolver<T>)(options);
    }
    return resolver;
};

const getHeaders = async (config: OpenAPIConfig, options: ApiRequestOptions): Promise<Headers> => {
    const token = await resolve(options, config.TOKEN);
    const username = await resolve(options, config.USERNAME);
    const password = await resolve(options, config.PASSWORD);
    const additionalHeaders = await resolve(options, config.HEADERS);

    const headers = Object.entries({
        Accept: 'application/json',
        ...additionalHeaders,
        ...options.headers,
    })
        .filter(([_, value]) => isDefined(value))
        .reduce((headers, [key, value]) => ({
            ...headers,
            [key]: String(value),
        }), {} as Record<string, string>);

    if (isStringWithValue(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (isStringWithValue(username) && isStringWithValue(password)) {
        const credentials = base64(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    if (options.body) {
        if (options.mediaType) {
            headers['Content-Type'] = options.mediaType;
        } else if (isBlob(options.body)) {
            headers['Content-Type'] = options.body.type || 'application/octet-stream';
        } else if (isString(options.body)) {
            headers['Content-Type'] = 'text/plain';
        } else if (!isFormData(options.body)) {
            headers['Content-Type'] = 'application/json';
        }
    }

    return new Headers(headers);
};

const getRequestBody = (options: ApiRequestOptions): any => {
    if (options.body !== undefined) {
        if (options.mediaType?.includes('/json')) {
            return JSON.stringify(options.body)
        } else if (isString(options.body) || isBlob(options.body) || isFormData(options.body)) {
            return options.body;
        } else {
            return JSON.stringify(options.body);
        }
    }
    return undefined;
};

//请求超时：codegen 请求均为常规 CRUD（媒体流与上传不走此处），正常远小于该值。
//Android 端 fetch 由 CapacitorHttp 原生层代理，对不可达端点可能长时间无响应
//（默认超时长达 10 分钟），登录门禁探测会因此一直转圈
const REQUEST_TIMEOUT_MS = 15000;

//原生平台直调 CapacitorHttp 的超时（毫秒）：fetch 垫片（Capacitor 的 native-bridge.js）
//不透传 connectTimeout/readTimeout，原生 HttpURLConnection 默认无限等待，不可达端点会永久
//挂起。直调把超时下沉到原生网络栈——请求真正终止，而非仅 JS 层放弃留下挂死的 socket
const NATIVE_CONNECT_TIMEOUT_MS = 10000;
const NATIVE_READ_TIMEOUT_MS = 15000;

/**
 * 原生平台：绕过 fetch 垫片直调 CapacitorHttp（垫片不传超时参数，见常量注释）。
 * CapacitorHttp 与 WebView 共享 CookieManager，会话行为与垫片路径一致。
 * FormData/Blob 请求不走此路径（上传类，回落 fetch 垫片 + 调用方的 race 超时兜底）
 */
async function nativeSend(
    options: ApiRequestOptions,
    url: string,
    body: any,
    headers: Headers
): Promise<Response> {
    const headerObj: Record<string, string> = {};
    headers.forEach((value, key) => {
        headerObj[key] = value;
    });
    const nativeResponse = await CapacitorHttp.request({
        url,
        method: options.method,
        headers: headerObj,
        //getRequestBody 对 JSON 请求已序列化为字符串；FormData/Blob 不进入本路径
        data: typeof body === 'string' ? body : undefined,
        connectTimeout: NATIVE_CONNECT_TIMEOUT_MS,
        readTimeout: NATIVE_READ_TIMEOUT_MS,
        //统一拿文本，交由 getResponseBody 按 Content-Type 决定 json()/text() 解析
        responseType: 'text',
    }).catch((error) => {
        //原生网络层失败（连接超时/拒绝、DNS 失败等）经 bridge 以 CapacitorException reject，
        //message 为 Java 异常原文（如 "failed to connect to ... after 10000ms"）。
        //必须转换为 TypeError：这是 fetch 垫片路径下网络失败的既有语义，登录门禁/重试
        //等调用方以 instanceof TypeError 判定网络层失败（不转换会被当作业务错误，
        //直接显示登录表单并透出 Java 原文）。原始信息仅记录控制台
        console.error('原生请求失败', error);
        throw new TypeError(`network request failed: ${options.method} ${url}`);
    });
    const bodyText = typeof nativeResponse.data === 'string'
        ? nativeResponse.data
        : nativeResponse.data === undefined || nativeResponse.data === null
            ? ''
            : JSON.stringify(nativeResponse.data);
    const nullBodyStatus = nativeResponse.status === 204 || nativeResponse.status === 205 || nativeResponse.status === 304;
    return new Response(nullBodyStatus ? null : bodyText, {
        status: nativeResponse.status,
        headers: new Headers(nativeResponse.headers as Record<string, string>),
    });
}

export const sendRequest = async (
    config: OpenAPIConfig,
    options: ApiRequestOptions,
    url: string,
    body: any,
    formData: FormData | undefined,
    headers: Headers,
    onCancel: OnCancel
): Promise<Response> => {
    const controller = new AbortController();

    const request: RequestInit = {
        headers,
        body: body ?? formData,
        method: options.method,
        signal: controller.signal,
    };

    //登录态依赖 userId/sessionId 双 cookie，所有请求无条件携带。
    //不读 config.WITH_CREDENTIALS：OpenAPI.ts 每次重新生成都会回退为
    //生成器默认值 false，Electron 直连 apiHost 的跨源请求会因此丢 cookie
    request.credentials = 'include';

    onCancel(() => controller.abort());

    //原生平台：JSON 等常规请求直调 CapacitorHttp（超时由原生层强制执行）
    const effectiveBody: any = body ?? formData;
    if (Capacitor.isNativePlatform() && !isFormData(effectiveBody) && !isBlob(effectiveBody)) {
        return await nativeSend(options, url, body, headers);
    }

    //其余路径的超时用 Promise.race 而非仅靠 abort 信号：CapacitorHttp 的 fetch 垫片不感知
    //AbortSignal，race 保证调用方在超时后必定拿到 TypeError（登录页据此走连接失败分支）
    let abortHandle: ReturnType<typeof setTimeout> | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
            () => reject(new TypeError(`request timeout after ${REQUEST_TIMEOUT_MS}ms: ${options.method} ${url}`)),
            REQUEST_TIMEOUT_MS
        );
    });
    abortHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await Promise.race([fetch(url, request), timeoutPromise]);
    } finally {
        if (abortHandle !== undefined) {
            clearTimeout(abortHandle);
        }
        if (timeoutHandle !== undefined) {
            clearTimeout(timeoutHandle);
        }
    }
};

const getResponseHeader = (response: Response, responseHeader?: string): string | undefined => {
    if (responseHeader) {
        const content = response.headers.get(responseHeader);
        if (isString(content)) {
            return content;
        }
    }
    return undefined;
};

const getResponseBody = async (response: Response): Promise<any> => {
    if (response.status !== 204) {
        try {
            const contentType = response.headers.get('Content-Type');
            if (contentType) {
                const jsonTypes = ['application/json', 'application/problem+json']
                const isJSON = jsonTypes.some(type => contentType.toLowerCase().startsWith(type));
                if (isJSON) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    return undefined;
};

const catchErrorCodes = (options: ApiRequestOptions, result: ApiResult): void => {
    const errors: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        ...options.errors,
    }

    const error = errors[result.status];
    if (error) {
        throw new ApiError(options, result, error);
    }

    if (!result.ok) {
        throw new ApiError(options, result, 'Generic Error');
    }
};


/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
export const request = <T>(config: OpenAPIConfig, options: ApiRequestOptions): CancelablePromise<T> => {
    return new CancelablePromise(async (resolve, reject, onCancel) => {
        try {

            // Capacitor 原生：持久化端点（lib/apiServer.ts，未设置回落构建期内联值），
            //   fetch 由 CapacitorHttp 原生网络层发出，无 CORS，媒体相对路径由 MainActivity 的壳层代理转发
            // 网页端：空串（同源，nginx 反代）；开发态：dev server 的 rewrites 反代
            // Electron：配置的 apiHost（媒体走 app:// 壳层代理，API 直连靠后端 CORS 白名单）
            config.BASE = Capacitor.isNativePlatform() ? await ensureNativeApiBase() : await ensureApiBase();

            const url = getUrl(config, options);
            const formData = getFormData(options);
            const body = getRequestBody(options);
            const headers = await getHeaders(config, options);

            if (!onCancel.isCancelled) {
                const response = await sendRequest(config, options, url, body, formData, headers, onCancel);
                const responseBody = await getResponseBody(response);
                const responseHeader = getResponseHeader(response, options.responseHeader);

                const result: ApiResult = {
                    url,
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    body: responseBody,
                };

                catchErrorCodes(options, result);

                //处理后端抛出的业务错误信息
                if (responseBody !== undefined && responseBody.code !== undefined && responseBody.code !== 0) {
                    reject(new ApiError(options, result, responseBody.message))
                }

                resolve(result.body);
            }
        } catch (error) {
            //网络错误
            pushToast("服务错误，请稍后尝试", "error", "bottom-left")
            reject(error);
        }
    });
};
