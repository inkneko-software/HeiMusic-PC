/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Music } from './Music';

export type ResponseListMusic = {
    code?: number;
    message?: string;
    data?: Array<Music>;
};
