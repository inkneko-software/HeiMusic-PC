/** 封面为空时的兜底图 */
export const DEFAULT_COVER = '/images/lxh_sign_400x400.png';

/** 首页封面统一请求 w300h300 压缩图，避免大图拖慢首屏 */
export const coverUrlOf = (url?: string | null) => (url ? `${url}?s=@w300h300` : DEFAULT_COVER);
