/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddLyricDto } from '../models/AddLyricDto';
import type { ResponseInteger } from '../models/ResponseInteger';
import type { ResponseListLyricVo } from '../models/ResponseListLyricVo';
import type { ResponseLyricCoverageVo } from '../models/ResponseLyricCoverageVo';
import type { ResponseLyricFetchVo } from '../models/ResponseLyricFetchVo';
import type { ResponseLyricVo } from '../models/ResponseLyricVo';
import type { ResponseObject } from '../models/ResponseObject';
import type { ResponsePageLyricFetchLog } from '../models/ResponsePageLyricFetchLog';
import type { UpdateLyricDto } from '../models/UpdateLyricDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class LyricControllerService {

    /**
     * 更新歌词
     * 仅更新提供的内容与格式字段；不支持修改语言与所属音乐（改语言=删旧增新）
     * @param requestBody 
     * @returns ResponseLyricVo OK
     * @throws ApiError
     */
    public static updateLyric(
requestBody: UpdateLyricDto,
): CancelablePromise<ResponseLyricVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lyric/updateLyric',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 设定/取消默认歌词
     * lyricId不传表示取消默认
     * @param musicId 
     * @param lyricId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static setDefaultLyric(
musicId: number,
lyricId?: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lyric/setDefaultLyric',
            query: {
                'musicId': musicId,
                'lyricId': lyricId,
            },
        });
    }

    /**
     * 一键扫描缺失歌词
     * 查询全部无歌词且非纯音乐的音乐，投放批量拉取队列（消费端以2秒/首串行执行，不覆盖已有歌词）。60秒节流窗口内重复调用返回5006。data=本次投放的音乐数
     * @returns ResponseInteger OK
     * @throws ApiError
     */
    public static scanMissingLyric(): CancelablePromise<ResponseInteger> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lyric/scanMissingLyric',
        });
    }

    /**
     * 删除歌词
     * 若为默认歌词则同步清除music表中的默认引用
     * @param lyricId 
     * @returns ResponseObject OK
     * @throws ApiError
     */
    public static removeLyric(
lyricId: number,
): CancelablePromise<ResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lyric/removeLyric',
            query: {
                'lyricId': lyricId,
            },
        });
    }

    /**
     * 从LRCLIB拉取歌词
     * 仅服务无歌词的音乐，人工数据无条件优先。outcome：created=已创建歌词（lyric字段非空）/instrumental=LRCLIB标记纯音乐/not_found=LRCLIB暂无该曲目（后台会补录，可重试）。locale不传时按歌词文本自动判定语言，无法判定存und
     * @param musicId 
     * @param locale 
     * @returns ResponseLyricFetchVo OK
     * @throws ApiError
     */
    public static fetchFromLrclib(
musicId: number,
locale?: string,
): CancelablePromise<ResponseLyricFetchVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lyric/fetchFromLrclib',
            query: {
                'musicId': musicId,
                'locale': locale,
            },
        });
    }

    /**
     * 添加歌词
     * 同一音乐同一语言（locale）仅允许一份；翻译=另一条locale记录
     * @param requestBody 
     * @returns ResponseLyricVo OK
     * @throws ApiError
     */
    public static add(
requestBody: AddLyricDto,
): CancelablePromise<ResponseLyricVo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lyric/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 按id查询歌词
     * @param lyricId 
     * @returns ResponseLyricVo OK
     * @throws ApiError
     */
    public static get(
lyricId: number,
): CancelablePromise<ResponseLyricVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lyric/get',
            query: {
                'lyricId': lyricId,
            },
        });
    }

    /**
     * 查询某音乐的全部歌词
     * 返回含content的完整列表，isDefault标识默认歌词
     * @param musicId 
     * @returns ResponseListLyricVo OK
     * @throws ApiError
     */
    public static getList(
musicId: number,
): CancelablePromise<ResponseListLyricVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lyric/getList',
            query: {
                'musicId': musicId,
            },
        });
    }

    /**
     * 歌词覆盖率统计
     * 返回音乐总数与有歌词的音乐数（同音乐多语言仅计一次），用于歌词拉取进度展示
     * @returns ResponseLyricCoverageVo OK
     * @throws ApiError
     */
    public static getCoverage(): CancelablePromise<ResponseLyricCoverageVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lyric/getCoverage',
        });
    }

    /**
     * 查询某音乐指定语言的歌词
     * @param musicId 
     * @param locale 
     * @returns ResponseLyricVo OK
     * @throws ApiError
     */
    public static getByLocale(
musicId: number,
locale: string,
): CancelablePromise<ResponseLyricVo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lyric/getByLocale',
            query: {
                'musicId': musicId,
                'locale': locale,
            },
        });
    }

    /**
     * 分页查询歌词拉取任务日志
     * 按时间倒序，记录每次拉取尝试的结局（含批量任务与手动拉取）。outcome：created=已创建歌词/instrumental=纯音乐/not_found=暂无曲目/skipped=跳过（已有歌词等）/failed=失败
     * @param page 
     * @param pageSize 
     * @param musicId 
     * @param outcome 
     * @returns ResponsePageLyricFetchLog OK
     * @throws ApiError
     */
    public static fetchLogList(
page: number = 1,
pageSize: number = 20,
musicId?: number,
outcome?: string,
): CancelablePromise<ResponsePageLyricFetchLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lyric/fetchLog/list',
            query: {
                'page': page,
                'pageSize': pageSize,
                'musicId': musicId,
                'outcome': outcome,
            },
        });
    }

}
