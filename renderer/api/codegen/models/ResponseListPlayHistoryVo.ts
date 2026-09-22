/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PlayHistoryVo } from './PlayHistoryVo';

export type ResponseListPlayHistoryVo = {
    code?: number;
    message?: string;
    data?: Array<PlayHistoryVo>;
};
