/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LyricVo } from './LyricVo';

export type ResponseListLyricVo = {
    code?: number;
    message?: string;
    data?: Array<LyricVo>;
};
