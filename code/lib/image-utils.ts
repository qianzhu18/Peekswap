/**
 * 图片处理工具函数
 */

import { calculateCompositePlan } from "./layout"

export interface ProcessedImage {
  url: string
  originalUrl: string
  name: string
  width: number
  height: number
  processedWidth: number
  processedHeight: number
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

const WHITE_THRESHOLD = 245
const WHITE_RATIO = 0.95
const MIN_BAND = 80
const SAFE_MARGIN = 30
const MAX_TRIM_RATIO = 0.3
const MIN_DIMENSION = 256

interface TrimResult {
  url: string
  width: number
  height: number
}

const isWhitePixel = (r: number, g: number, b: number) => r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD

const smartTrimImage = async (img: HTMLImageElement): Promise<TrimResult | null> => {
  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0)

  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height).data

  const rowIsWhite = (y: number) => {
    let whitePixels = 0
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (isWhitePixel(imageData[idx], imageData[idx + 1], imageData[idx + 2])) {
        whitePixels++
      }
    }
    return whitePixels / width >= WHITE_RATIO
  }

  const colIsWhite = (x: number) => {
    let whitePixels = 0
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      if (isWhitePixel(imageData[idx], imageData[idx + 1], imageData[idx + 2])) {
        whitePixels++
      }
    }
    return whitePixels / height >= WHITE_RATIO
  }

  let topBand = 0
  while (topBand < height && rowIsWhite(topBand)) {
    topBand++
  }

  let bottomBand = 0
  while (bottomBand < height && rowIsWhite(height - 1 - bottomBand)) {
    bottomBand++
  }

  let leftBand = 0
  while (leftBand < width && colIsWhite(leftBand)) {
    leftBand++
  }

  let rightBand = 0
  while (rightBand < width && colIsWhite(width - 1 - rightBand)) {
    rightBand++
  }

  const cropTop = topBand >= MIN_BAND ? Math.max(0, topBand - SAFE_MARGIN) : 0
  const cropBottom = bottomBand >= MIN_BAND ? Math.max(0, bottomBand - SAFE_MARGIN) : 0
  const cropLeft = leftBand >= MIN_BAND ? Math.max(0, leftBand - SAFE_MARGIN) : 0
  const cropRight = rightBand >= MIN_BAND ? Math.max(0, rightBand - SAFE_MARGIN) : 0

  const croppedWidth = width - cropLeft - cropRight
  const croppedHeight = height - cropTop - cropBottom

  const originalArea = width * height
  const croppedArea = croppedWidth * croppedHeight

  const tooSmall = croppedWidth < MIN_DIMENSION || croppedHeight < MIN_DIMENSION
  const trimmedTooMuch = croppedArea < originalArea * (1 - MAX_TRIM_RATIO)

  if (tooSmall || trimmedTooMuch || croppedWidth <= 0 || croppedHeight <= 0) {
    return null
  }

  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = croppedWidth
  outputCanvas.height = croppedHeight
  const outputCtx = outputCanvas.getContext("2d")!
  outputCtx.drawImage(canvas, cropLeft, cropTop, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight)

  const blob = await new Promise<Blob | null>((resolve) => outputCanvas.toBlob((b) => resolve(b), "image/png", 0.95))
  if (!blob) {
    return null
  }

  return {
    url: URL.createObjectURL(blob),
    width: croppedWidth,
    height: croppedHeight,
  }
}

export const processImage = async (file: File): Promise<ProcessedImage> => {
  const validation = await validateImage(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const originalUrl = URL.createObjectURL(file)
  const img = await loadImage(originalUrl)

  const trimmed = await smartTrimImage(img)

  if (!trimmed) {
    return {
      url: originalUrl,
      originalUrl,
      name: file.name,
      width: img.width,
      height: img.height,
      processedWidth: img.width,
      processedHeight: img.height,
      size: file.size,
    }
  }

  return {
    url: trimmed.url,
    originalUrl,
    name: file.name,
    width: img.width,
    height: img.height,
    processedWidth: trimmed.width,
    processedHeight: trimmed.height,
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
  const plan = calculateCompositePlan(imageA, imageB, coverRatio)

  if (!plan) {
    throw new Error("缺少可用的图片数据")
  }

  const canvas = document.createElement("canvas")
  canvas.width = plan.targetWidth
  canvas.height = plan.targetHeight
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, plan.targetWidth, plan.targetHeight)

  const drawImage = async (imgData: ProcessedImage, url: string, destY: number, destHeight: number) => {
    if (!imgData || destHeight <= 0) return
    const bitmap = await loadImage(url)
    ctx.drawImage(
      bitmap,
      0,
      0,
      imgData.processedWidth,
      imgData.processedHeight,
      plan.sidePadding,
      destY,
      plan.contentWidth,
      destHeight,
    )
  }

  if (plan.coverHeight > 0 && imageA) {
    await drawImage(imageA, imageA.url, plan.coverStart, plan.coverHeight)
  }

  if (plan.effectHeight > 0 && imageB) {
    await drawImage(imageB, imageB.url, plan.effectStart, plan.effectHeight)
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
