import type { ResponseUserDetailVo } from "@api/codegen"
import { UserControllerService } from "@api/codegen"

/** 服务端限制：头像单文件最大 10MB */
const MAX_AVATAR_SIZE = 10 * 1024 * 1024
/** 前端裁剪输出边长：正方形 ≤1024px（服务端存原图不压缩，列表页流量靠这里控制） */
const AVATAR_EDGE = 1024

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

/**
 * 头像上传前的预处理：
 * - GIF 原样上传（canvas 重编码会丢动画），仅做大小检查
 * - 其余图片居中裁剪为正方形、缩放到 ≤1024px 后重编码为 WebP（编码失败回落 JPEG）
 */
async function processAvatarFile(file: File): Promise<File> {
    if (file.type === "image/gif") {
        if (file.size > MAX_AVATAR_SIZE) {
            throw new Error("GIF 文件超过 10MB，请先压缩后再上传")
        }
        return file
    }

    let bitmap: ImageBitmap
    try {
        //EXIF 方向信息交给浏览器处理，避免手机竖拍照片裁剪方向错误
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch (e) {
        throw new Error("图片解析失败，请确认文件未损坏")
    }

    try {
        const edge = Math.min(bitmap.width, bitmap.height)
        const scale = Math.min(1, AVATAR_EDGE / edge)
        const target = Math.round(edge * scale)
        const canvas = document.createElement("canvas")
        canvas.width = target
        canvas.height = target
        canvas.getContext("2d")!.drawImage(
            bitmap,
            Math.round((bitmap.width - edge) / 2), Math.round((bitmap.height - edge) / 2), edge, edge,
            0, 0, target, target
        )

        let type = "image/webp"
        let blob = await canvasToBlob(canvas, type, 0.9)
        if (blob === null) {
            type = "image/jpeg"
            blob = await canvasToBlob(canvas, type, 0.9)
        }
        if (blob === null) {
            throw new Error("图片编码失败，请更换图片重试")
        }
        if (blob.size > MAX_AVATAR_SIZE) {
            throw new Error("处理后的图片仍超过 10MB，请更换图片")
        }
        //文件名与类型一致：服务端按实际内容探测，改扩展名无效，但保持一致便于排查
        return new File([blob], `avatar.${type === "image/webp" ? "webp" : "jpg"}`, { type })
    } finally {
        bitmap.close()
    }
}

/**
 * 更新当前登录用户头像（/api/v1/user/updateAvatar）。
 *
 * 注意后端频控：每用户每小时最多 5 次请求（含校验失败的请求），因此先在前端
 * 完成裁剪压缩与大小校验再发起请求。业务错误（2001~2004）由 request.ts 统一
 * reject 携带后端 message，调用方直接展示 error.message 即可。
 */
export async function uploadAvatar(file: File): Promise<ResponseUserDetailVo> {
    const processed = await processAvatarFile(file)
    return UserControllerService.updateAvatar({ avatar: processed })
}
