/**
 * 图片处理工具函数
 */

export interface ProcessedImage {
  url: string
  name: string
  width: number
  height: number
  size: number
}

export const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "太糊啦，他可能认不出你 - 请选择图片文件" }
  }

  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: "图片太大啦 - 缩小一下吧" }
  }

  return { valid: true }
}

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("图片加载失败"))
    img.src = url
  })
}

export const processImage = async (file: File): Promise<ProcessedImage> => {
  const validation = await validateImage(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const url = URL.createObjectURL(file)
  const img = await loadImage(url)

  return {
    url,
    name: file.name,
    width: img.width,
    height: img.height,
    size: file.size,
  }
}

/**
 * 合成图片 - 包含白色遮挡区的长图
 * 新增白色遮挡区逻辑，不是简单的图片拼接
 */
export const composeImages = async (
  imageA: ProcessedImage,
  imageB: ProcessedImage,
  whiteBarHeightPx: number,
): Promise<Blob> => {
  // 以较小宽度为基准，避免放大失真
  const targetWidth = Math.min(imageA.width, imageB.width)

  // 计算图片A的显示高度（根据宽度等比缩放）
  const imgAHeight = Math.round((targetWidth / imageA.width) * imageA.height)

  // 计算图片B的显示高度
  const imgBHeight = Math.round((targetWidth / imageB.width) * imageB.height)

  // 额外白底：顶部留白 + 图片间隔 + 底部留白（确保第二张图在整张长图中心位置）
  const paddingTop = whiteBarHeightPx
  const paddingBetween = whiteBarHeightPx
  const paddingBottom = paddingTop + imgAHeight + paddingBetween

  const totalHeight = paddingTop + imgAHeight + paddingBetween + imgBHeight + paddingBottom

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext("2d")!

  // 填充白色背景
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, targetWidth, totalHeight)

  // 加载图片
  const imgAElement = await loadImage(imageA.url)
  const imgBElement = await loadImage(imageB.url)

  // 绘制封面部分（图片A）到顶部留白之后
  ctx.drawImage(imgAElement, 0, paddingTop, targetWidth, imgAHeight)

  // 白色遮挡区（位于两张图之间）已经通过填充实现

  // 绘制彩蛋部分（图片B）到中部遮挡区之后
  const imageBStartY = paddingTop + imgAHeight + paddingBetween
  ctx.drawImage(imgBElement, 0, imageBStartY, targetWidth, imgBHeight)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
      },
      "image/jpeg",
      0.95,
    )
  })
}
