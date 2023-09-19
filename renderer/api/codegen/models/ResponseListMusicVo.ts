/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { MusicVo } from './MusicVo';

export type ResponseListMusicVo = {
    code?: number;
    message?: string;
    data?: Array<MusicVo>;
};
