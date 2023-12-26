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
    bitrate?: string;
    codec?: string;
    duration?: number;
    albumId?: number;
    albumTitle?: string;
    albumCoverUrl?: string;
    artistList?: Array<ArtistVo>;
    resourceList?: Array<MusicResourceVo>;
    isFavorite?: boolean;
};
