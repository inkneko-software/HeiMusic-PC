/**
 * 本地打包的默认头像资源。
 *
 * 后端用户模块更新后，未设置头像时 avatarUrl 返回空串（不再返回
 * /public/images/default_avatar.jpg 之类的后端路径），展示侧统一通过
 * resolveAvatarUrl() 回落到该本地资源。
 */
export const DEFAULT_AVATAR_URL = '/images/default_avatar.jpg'

/**
 * 头像地址兜底：未设置（空串/null/undefined）时回落本地默认头像
 */
export function resolveAvatarUrl(avatarUrl?: string | null): string {
    return avatarUrl && avatarUrl.length !== 0 ? avatarUrl : DEFAULT_AVATAR_URL
}
