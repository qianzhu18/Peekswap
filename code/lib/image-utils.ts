/**
 * 图片处理工具函数
 */

import { calculateCompositeLayout } from "./layout"

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
  const layout = calculateCompositeLayout(imageA, imageB, targetWidth, coverRatio)
  const canvasHeight = Math.max(layout.totalHeight, 1)

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext("2d")!

  // 填充白色背景
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, targetWidth, canvasHeight)

  // 加载图片
  const imgAElement = await loadImage(imageA.url)
  const imgBElement = await loadImage(imageB.url)

  if (layout.scaledBHeight > 0 && layout.scaleB > 0) {
    const topDestY = layout.whiteTop
    const bottomDestY = layout.coverStart + layout.coverHeight

    const scaleB = layout.scaleB || (targetWidth / (safeBWidth || 1))
    const clampSource = (value: number) => Math.min(Math.max(value, 0), imageB.height)

    if (layout.topHeight > 0) {
      const topSourceHeight = clampSource(layout.topHeight / scaleB)
      if (topSourceHeight > 0) {
        ctx.drawImage(
          imgBElement,
          0,
          0,
          imageB.width,
          topSourceHeight,
          0,
          topDestY,
          targetWidth,
          layout.topHeight,
        )
      }
    }

    if (layout.bottomHeight > 0) {
      const bottomSourceHeight = clampSource(layout.bottomHeight / scaleB)
      if (bottomSourceHeight > 0) {
        ctx.drawImage(
          imgBElement,
          0,
          imageB.height - bottomSourceHeight,
          imageB.width,
          bottomSourceHeight,
          0,
          bottomDestY,
          targetWidth,
          layout.bottomHeight,
        )
      }
    }
  }

  if (layout.coverHeight > 0) {
    const scaleA = layout.scaleA || (targetWidth / imageA.width)
    const scaledAHeight = Math.max(Math.round(imageA.height * scaleA), 0)
    let sourceAY = 0
    let sourceAHeight = imageA.height
    let destAHeight = layout.coverHeight
    let destAY = layout.coverStart

    if (scaledAHeight <= layout.coverHeight && scaledAHeight > 0) {
      destAHeight = scaledAHeight
      destAY = layout.coverStart + layout.coverImageOffset
    } else if (scaledAHeight > 0) {
      const cropRatio = layout.coverHeight / scaledAHeight
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
