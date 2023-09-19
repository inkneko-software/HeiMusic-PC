/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ArtistVo } from './ArtistVo';

export type AlbumVo = {
    albumId?: number;
    title?: string;
    translateTitle?: string;
    frontCoverUrl?: string;
    backCoverUrl?: string;
    musicNum?: number;
    artistList?: Array<ArtistVo>;
};
