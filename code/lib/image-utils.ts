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

  if (layout.effectHeight > 0 && layout.scaleB > 0) {
    ctx.drawImage(
      imgBElement,
      0,
      0,
      imageB.width,
      imageB.height,
      0,
      layout.effectStart,
      targetWidth,
      layout.effectHeight,
    )
  }

  if (layout.coverHeight > 0) {
    ctx.drawImage(
      imgAElement,
      0,
      0,
      imageA.width,
      imageA.height,
      0,
      layout.coverStart,
      targetWidth,
      layout.coverHeight,
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
