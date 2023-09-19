/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AlbumVo } from './AlbumVo';

export type ResponseListAlbumVo = {
    code?: number;
    message?: string;
    data?: Array<AlbumVo>;
};
