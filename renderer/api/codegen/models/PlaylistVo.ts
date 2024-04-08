/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { UserBasicVo } from './UserBasicVo';

export type PlaylistVo = {
    playlistId?: number;
    uploader?: UserBasicVo;
    title?: string;
    description?: string;
    sequenceNumber?: number;
    coverUrl?: string;
    playCount?: number;
    createdAt?: string;
};
