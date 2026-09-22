/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type UpdateLyricDto = {
    /**
     * 歌词id
     */
    lyricId: number;
    /**
     * 歌词全文，传null保持不变
     */
    content?: string;
    /**
     * 歌词格式标识，传null保持不变
     */
    format?: string;
};
