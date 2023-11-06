/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ArtistVo } from './ArtistVo';
import type { MusicResourceVo } from './MusicResourceVo';

export type MusicVo = {
    musicId?: number;
    title?: string;
    translateTitle?: string;
    resourceUrl?: string;
    bitrate?: number;
    codec?: string;
    duration?: number;
    artistList?: Array<ArtistVo>;
    resourceList?: Array<MusicResourceVo>;
};