/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { MusicVo } from './MusicVo';

export type PlayHistoryVo = {
    music?: MusicVo;
    playCount?: number;
    lastPlayedAt?: string;
};
