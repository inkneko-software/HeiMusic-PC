/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type UpdatePlaylistInfoDto = {
    /**
     * 播放列表id
     */
    playlistId: number;
    /**
     * 标题
     */
    title?: string;
    /**
     * 说明信息
     */
    description?: string;
    /**
     * 序号
     */
    sequenceNumber?: number;
    coverFile?: Blob;
};
