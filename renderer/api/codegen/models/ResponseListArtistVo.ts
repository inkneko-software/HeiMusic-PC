/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ArtistVo } from './ArtistVo';

export type ResponseListArtistVo = {
    code?: number;
    message?: string;
    data?: Array<ArtistVo>;
};
