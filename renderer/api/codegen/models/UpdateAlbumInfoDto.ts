/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 更新专辑请求参数
 */
export type UpdateAlbumInfoDto = {
    /**
     * 专辑id
     */
    albumId: number;
    /**
     * 专辑标题
     */
    title?: string;
    cover?: Blob;
};
