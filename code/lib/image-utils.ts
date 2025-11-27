import { calculateCompositePlan } from "./layout"

export interface ProcessedImage {
  url: string
  name: string
  width: number
  height: number
  size: number
}

const TARGET_ASPECT_RATIO = 9 / 16
const CONTACT_WATERMARK_PATH = "/contact-qr.jpg"
const WATERMARK_WIDTH_RATIO = 0.32
const WATERMARK_TEXT =
  "如果你觉得好玩有趣，欢迎联系网站的开发作者，提供你的好玩有趣的小点子，我们一起交流~"
const WATERMARK_SUBTEXT = "保持原图比例，扫码即可加作者"

const appendNameSuffix = (name: string, suffix: string) => {
  const lastDot = name.lastIndexOf(".")
  if (lastDot > 0) {
    const base = name.slice(0, lastDot)
    const ext = name.slice(lastDot)
    return `${base}${suffix}${ext}`
  }
  return `${name}${suffix}`
}

const resolveAssetPrefix = () => {
  // 允许通过环境变量显式设置资源前缀（如 GitHub Pages 子路径）
  const rawPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || process.env.NEXT_PUBLIC_BASE_PATH || ""
  const envPrefix = rawPrefix.endsWith("/") ? rawPrefix.slice(0, -1) : rawPrefix
  if (envPrefix) return envPrefix

  // 回退到当前路径的首段作为子路径前缀，适配 /project/* 部署场景
  if (typeof window === "undefined") return ""
  const [firstSegment] = window.location.pathname.split("/").filter(Boolean)
  return firstSegment ? `/${firstSegment}` : ""
}

export const getContactWatermarkUrl = () => `${resolveAssetPrefix()}${CONTACT_WATERMARK_PATH}`

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

const getWatermarkUrlCandidates = () => {
  const candidates = new Set<string>()

  const primary = getContactWatermarkUrl()
  if (primary) candidates.add(primary)

  if (typeof window !== "undefined") {
    const withOrigin = (path: string) => {
      if (/^https?:\/\//.test(path)) return path
      return `${window.location.origin}${path}`
    }
    candidates.add(withOrigin(primary))
    candidates.add(withOrigin(CONTACT_WATERMARK_PATH))
    candidates.add(`${window.location.origin}${CONTACT_WATERMARK_PATH}`)
  }

  candidates.add(CONTACT_WATERMARK_PATH)
  candidates.add("contact-qr.jpg")
  candidates.add("./contact-qr.jpg")

  return Array.from(candidates).filter(Boolean)
}

const loadWatermarkImage = async () => {
  const candidates = getWatermarkUrlCandidates()
  for (const url of candidates) {
    try {
      return await loadImage(url)
    } catch (err) {
      // 尝试下一个候选 URL
      continue
    }
  }
  throw new Error("水印资源加载失败")
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

const ensureNineSixteen = async (image: ProcessedImage | null) => {
  if (!image) return null
  const ratio = image.width / image.height
  if (Math.abs(ratio - TARGET_ASPECT_RATIO) <= 0.01) {
    return image
  }
  return normalizeToNineSixteen(image)
}

export const normalizeToNineSixteen = async (image: ProcessedImage): Promise<ProcessedImage> => {
  const bitmap = await loadImage(image.url)
  const aspect = bitmap.width / bitmap.height

  if (Math.abs(aspect - TARGET_ASPECT_RATIO) < 0.001) {
    return image
  }

  let sx = 0
  let sy = 0
  let sw = bitmap.width
  let sh = bitmap.height

  if (aspect > TARGET_ASPECT_RATIO) {
    sw = Math.round(bitmap.height * TARGET_ASPECT_RATIO)
    sx = Math.floor((bitmap.width - sw) / 2)
  } else {
    sh = Math.round(bitmap.width / TARGET_ASPECT_RATIO)
    sy = Math.floor((bitmap.height - sh) / 2)
  }

  const canvas = document.createElement("canvas")
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("浏览器不支持图片处理")
  }

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error("生成 9:16 图片失败"))
        }
      },
      "image/jpeg",
      0.95,
    )
  })

  const objectUrl = URL.createObjectURL(blob)

  return {
    ...image,
    url: objectUrl,
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
    name: appendNameSuffix(image.name, "-9x16"),
  }
}

const calculateWatermarkPlacement = (
  plan: ReturnType<typeof calculateCompositePlan>,
  watermarkWidth: number,
  watermarkHeight: number,
  ctx: CanvasRenderingContext2D,
) => {
  if (!plan.whiteBottom || plan.contentWidth <= 0) return null
  const padding = Math.min(80, Math.round(plan.whiteBottom * 0.2))
  const availableHeight = plan.whiteBottom - padding * 2
  if (availableHeight <= 0) return null

  const maxQrWidth = Math.min(plan.contentWidth * WATERMARK_WIDTH_RATIO, plan.contentWidth * 0.5)
  const aspect = watermarkWidth / watermarkHeight || 1
  let qrWidth = Math.max(36, Math.round(maxQrWidth))
  let qrHeight = Math.max(36, Math.round(qrWidth / aspect))

  let fontSize = Math.max(14, Math.min(28, Math.round(plan.contentWidth * 0.028)))
  let lineHeight = Math.round(fontSize * 1.35)
  const textMaxWidth = Math.round(plan.contentWidth * 0.82)

  const wrapText = (text: string) => {
    ctx.font = `${fontSize}px "PingFang SC", "Inter", sans-serif`
    const words = [...text]
    const lines: string[] = []
    let current = ""
    words.forEach((ch) => {
      const next = current + ch
      const width = ctx.measureText(next).width
      if (width > textMaxWidth && current) {
        lines.push(current)
        current = ch
      } else {
        current = next
      }
    })
    if (current) lines.push(current)
    return lines
  }

  const measureBlock = () => {
    const primary = wrapText(WATERMARK_TEXT)
    const secondary = wrapText(WATERMARK_SUBTEXT)
    const textHeight = (primary.length + secondary.length) * lineHeight + lineHeight * 0.4
    const blockHeight = qrHeight + 10 + textHeight
    return { primary, secondary, textHeight, blockHeight }
  }

  let measured = measureBlock()
  while (measured.blockHeight > availableHeight && (qrWidth > 36 || fontSize > 12)) {
    if (qrWidth > 36) {
      qrWidth = Math.max(36, Math.round(qrWidth * 0.92))
      qrHeight = Math.max(36, Math.round(qrWidth / aspect))
    }
    if (measured.blockHeight > availableHeight && fontSize > 12) {
      fontSize = Math.max(12, Math.round(fontSize * 0.94))
      lineHeight = Math.round(fontSize * 1.35)
    }
    measured = measureBlock()
  }

  const startY =
    plan.targetHeight -
    plan.whiteBottom +
    padding +
    Math.max(0, Math.round((availableHeight - measured.blockHeight) / 2))
  const centerX = plan.sidePadding + plan.contentWidth / 2
  const qrX = Math.round(centerX - qrWidth / 2)
  const qrY = startY

  return {
    qr: { x: qrX, y: qrY, width: Math.round(qrWidth), height: Math.round(qrHeight) },
    text: {
      primary: measured.primary,
      secondary: measured.secondary,
      x: centerX,
      startY: qrY + qrHeight + 10 + lineHeight,
      fontSize,
      lineHeight,
      maxWidth: textMaxWidth,
    },
  }
}

export const composeImages = async (
  imageA: ProcessedImage | null,
  imageB: ProcessedImage | null,
  coverRatio: number,
): Promise<Blob> => {
  const normalizedA = await ensureNineSixteen(imageA)
  const normalizedB = await ensureNineSixteen(imageB)

  const plan = calculateCompositePlan(normalizedA, normalizedB, coverRatio)
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

  await drawImage(normalizedA, plan.effectStart, plan.effectHeight)
  await drawImage(normalizedB, plan.coverStart, plan.coverHeight)

  if (plan.whiteBottom > 0) {
    try {
      const watermark = await loadWatermarkImage()
      const placement = calculateWatermarkPlacement(plan, watermark.width, watermark.height, ctx)
      if (placement) {
        ctx.drawImage(watermark, placement.qr.x, placement.qr.y, placement.qr.width, placement.qr.height)

        ctx.textAlign = "center"
        ctx.fillStyle = "#4b5563"
        ctx.font = `${placement.text.fontSize}px "PingFang SC", "Inter", sans-serif`
        let cursorY = placement.text.startY
        placement.text.primary.forEach((line) => {
          ctx.fillText(line, placement.text.x, cursorY, placement.text.maxWidth)
          cursorY += placement.text.lineHeight
        })
        ctx.fillStyle = "#6b7280"
        placement.text.secondary.forEach((line) => {
          ctx.fillText(line, placement.text.x, cursorY, placement.text.maxWidth)
          cursorY += placement.text.lineHeight
        })
      }
    } catch (error) {
      console.error("水印绘制失败", error)
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
