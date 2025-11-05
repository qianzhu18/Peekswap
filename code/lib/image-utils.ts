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
  coverRatio: number,
): Promise<Blob> => {
  const safeBWidth = imageB.width > 0 ? imageB.width : imageA.width
  const targetWidth = Math.min(imageA.width, safeBWidth)
  const scaleB = targetWidth / (safeBWidth || 1)
  const scaledBHeight = Math.max(Math.round(imageB.height * scaleB), 1)

  const desiredCoverHeight = Math.max(Math.round(scaledBHeight * coverRatio), 40)
  const remainingHeight = Math.max(scaledBHeight - desiredCoverHeight, 0)
  const topHeight = Math.floor(remainingHeight / 2)
  const bottomHeight = remainingHeight - topHeight
  const coverHeight = scaledBHeight - topHeight - bottomHeight
  const totalHeight = topHeight + coverHeight + bottomHeight

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

  const topSourceHeight = topHeight > 0 ? topHeight / scaleB : 0
  const bottomSourceHeight = bottomHeight > 0 ? bottomHeight / scaleB : 0
  const coverSourceHeight = coverHeight > 0 ? coverHeight / scaleB : 0

  if (topHeight > 0) {
    ctx.drawImage(imgBElement, 0, 0, imageB.width, topSourceHeight, 0, 0, targetWidth, topHeight)
  }

  if (coverHeight > 0) {
    ctx.drawImage(
      imgBElement,
      0,
      topSourceHeight,
      imageB.width,
      coverSourceHeight,
      0,
      topHeight,
      targetWidth,
      coverHeight,
    )
  }

  if (bottomHeight > 0) {
    ctx.drawImage(
      imgBElement,
      0,
      imageB.height - bottomSourceHeight,
      imageB.width,
      bottomSourceHeight,
      0,
      topHeight + coverHeight,
      targetWidth,
      bottomHeight,
    )
  }

  const scaleA = targetWidth / imageA.width
  const scaledAHeight = Math.round(imageA.height * scaleA)
  let sourceAY = 0
  let sourceAHeight = imageA.height
  let destAY = topHeight
  let destAHeight = coverHeight

  if (scaledAHeight <= coverHeight) {
    destAHeight = scaledAHeight
    destAY = topHeight + Math.floor((coverHeight - scaledAHeight) / 2)
  } else if (scaledAHeight > 0) {
    const cropRatio = coverHeight / scaledAHeight
    const croppedHeight = Math.max(Math.round(imageA.height * cropRatio), 1)
    sourceAY = Math.floor((imageA.height - croppedHeight) / 2)
    sourceAHeight = croppedHeight
  }

  if (destAHeight > 0) {
    ctx.drawImage(
      imgAElement,
      0,
      sourceAY,
      imageA.width,
      sourceAHeight,
      0,
      destAY,
      targetWidth,
      destAHeight,
    )
  }

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
