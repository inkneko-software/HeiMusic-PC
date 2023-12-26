/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MusicDto } from '../models/MusicDto';
import type { ResponseListMusic } from '../models/ResponseListMusic';
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

    /**
     * 通过cue信息添加音乐
     * cue文件中声明了一个或多个FILE，每个FILE包含了一组TRACK（单曲的音乐信息）。通过上传file与该文件所拥有的单曲信息musicList，后端将自动将整个音轨切为对应的单曲，并添加到指定专辑
     * @param formData 
     * @returns ResponseListMusic OK
     * @throws ApiError
     */
    public static addMusicFromCue(
formData?: {
musicDtoList: Array<MusicDto>;
file: Blob;
},
): CancelablePromise<ResponseListMusic> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music/addMusicFromCue',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }

}
