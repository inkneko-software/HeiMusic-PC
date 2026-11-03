import type { SyntheticEvent } from 'react';

/** 封面缺失/加载失败时统一回落的兜底图 */
export const DEFAULT_COVER = '/images/lxh_sign_400x400.png';

/** 首页封面统一请求 w300h300 压缩图，避免大图拖慢首屏；空封面回落兜底图 */
export const coverUrlOf = (url?: string | null) => (url ? `${url}?s=@w300h300` : DEFAULT_COVER);

/** 封面 img 的 onError 兜底：URL 非空但加载失败（如后端资源已失效）时换兜底图；
 *  img.src 为解析后的绝对地址，用 endsWith 判断是否已在兜底图上，防失败死循环 */
export const onCoverError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (!img.src.endsWith(DEFAULT_COVER)) {
        img.src = DEFAULT_COVER;
    }
};
