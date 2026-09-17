/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 更新用户资料请求参数
 */
export type UpdateUserInfoDto = {
    /**
     * 用户名，传null清空
     */
    username?: string;
    /**
     * 生日（yyyy-MM-dd），传null清空
     */
    birth?: string;
    /**
     * 性别（m/f），传null清空
     */
    gender?: string;
    /**
     * 个性签名，传null视为空串
     */
    sign?: string;
};
