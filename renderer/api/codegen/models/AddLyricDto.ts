/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type AddLyricDto = {
    /**
     * 所属音乐id
     */
    musicId: number;
    /**
     * 语言标签，BCP 47风格，如zh-cn、ja，入库统一小写
     */
    locale: string;
    /**
     * 歌词格式标识：text/lrc/lrc_a2/qrc等
     */
    format: string;
    /**
     * 歌词全文，格式由format字段解释
     */
    content: string;
};
