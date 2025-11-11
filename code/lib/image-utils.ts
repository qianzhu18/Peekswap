import { calculateCompositePlan } from "./layout"

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

export const composeImages = async (
  imageA: ProcessedImage | null,
  imageB: ProcessedImage | null,
  coverRatio: number,
): Promise<Blob> => {
  const plan = calculateCompositePlan(imageA, imageB, coverRatio)
  if (!plan) {
    throw new Error("请至少上传一张图片")
  }

  const canvas = document.createElement("canvas")
  canvas.width = plan.targetWidth
  canvas.height = plan.targetHeight
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, plan.targetWidth, plan.targetHeight)

  const drawImage = async (imgData: ProcessedImage | null, destY: number, destHeight: number) => {
    if (!imgData || destHeight <= 0) return
    const bitmap = await loadImage(imgData.url)
    ctx.drawImage(
      bitmap,
      0,
      0,
      imgData.width,
      imgData.height,
      plan.sidePadding,
      destY,
      plan.contentWidth,
      destHeight,
    )
  }

  await drawImage(imageA, plan.effectStart, plan.effectHeight)
  await drawImage(imageB, plan.coverStart, plan.coverHeight)

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
