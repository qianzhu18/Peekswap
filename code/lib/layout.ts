export interface LayoutImageLike {
  width: number
  height: number
}

export interface CompositeLayout {
  whiteTop: number
  whiteBottom: number
  gapHeight: number
  coverHeight: number
  coverStart: number
  coverImageOffset: number
  effectStart: number
  effectHeight: number
  scaledAHeight: number
  scaledBHeight: number
  totalHeight: number
  scaleA: number
  scaleB: number
}

export interface CompositePlan {
  targetWidth: number
  targetHeight: number
  whiteTop: number
  whiteBottom: number
  gapHeight: number
  coverHeight: number
  effectHeight: number
  coverStart: number
  effectStart: number
  contentWidth: number
  sidePadding: number
  scaleFactor: number
}

export interface PreviewLayout {
  previewWidth: number
  previewHeight: number
  whiteTop: number
  whiteBottom: number
  gapHeight: number
  coverHeight: number
  effectHeight: number
  coverStart: number
  effectStart: number
}

const WHITE_BOTTOM_RATIO = 1.1
const WHITE_PADDING_MIN = 420
const GAP_RATIO = 0.24
const GAP_MIN = 160

const clampPositive = (value: number) => Math.max(0, Math.round(value))

export const calculateCompositeLayout = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
  targetWidth: number,
  coverRatio: number,
): CompositeLayout => {
  if (!imageA && !imageB) {
    return {
      whiteTop: 0,
      whiteBottom: 0,
      topHeight: 0,
      coverHeight: 0,
      bottomHeight: 0,
      coverStart: 0,
      coverImageOffset: 0,
      effectStart: 0,
      scaledAHeight: 0,
      scaledBHeight: 0,
      totalHeight: 0,
      scaleA: 0,
      scaleB: 0,
    }
  }

  const safeWidthA = imageA?.width ?? targetWidth
  const safeWidthB = imageB?.width ?? targetWidth
  const scaleA = imageA ? targetWidth / (safeWidthA || 1) : 0
  const scaleB = imageB ? targetWidth / (safeWidthB || 1) : 0

  const scaledAHeight = imageA ? clampPositive(imageA.height * scaleA) : 0
  const scaledBHeight = imageB ? clampPositive(imageB.height * scaleB) : 0

  const whiteBottom = Math.max(
    clampPositive(targetWidth * WHITE_BOTTOM_RATIO),
    WHITE_PADDING_MIN,
  )

  const gapHeight = imageA && imageB
    ? Math.max(clampPositive(targetWidth * GAP_RATIO), GAP_MIN)
    : 0

  if (!imageA && !imageB) {
    return {
      whiteTop: whiteBottom,
      whiteBottom,
      gapHeight: 0,
      coverHeight: 0,
      coverStart: whiteBottom,
      coverImageOffset: 0,
      effectStart: whiteBottom,
      effectHeight: 0,
      scaledAHeight: 0,
      scaledBHeight: 0,
      totalHeight: whiteBottom * 2,
      scaleA,
      scaleB,
    }
  }

  if (!imageB || scaledBHeight === 0) {
    const coverStart = whiteBottom
    const totalHeight = whiteBottom * 2 + scaledAHeight
    return {
      whiteTop: whiteBottom,
      whiteBottom,
      gapHeight: 0,
      coverHeight: scaledAHeight,
      coverStart,
      coverImageOffset: 0,
      effectStart: coverStart + scaledAHeight,
      effectHeight: 0,
      scaledAHeight,
      scaledBHeight: 0,
      totalHeight,
      scaleA,
      scaleB: 0,
    }
  }

  if (!imageA || scaledAHeight === 0) {
    const coverStart = whiteBottom
    const totalHeight = whiteBottom * 2 + scaledBHeight
    return {
      whiteTop: whiteBottom,
      whiteBottom,
      gapHeight: 0,
      coverHeight: 0,
      coverStart,
      coverImageOffset: 0,
      effectStart: coverStart,
      effectHeight: scaledBHeight,
      scaledAHeight: 0,
      scaledBHeight,
      totalHeight,
      scaleA: 0,
      scaleB,
    }
  }

  const whiteTop = whiteBottom + gapHeight + scaledBHeight
  const coverStart = whiteTop
  const effectStart = coverStart + scaledAHeight + gapHeight
  const totalHeight = whiteTop + scaledAHeight + gapHeight + scaledBHeight + whiteBottom

  return {
    whiteTop,
    whiteBottom,
    gapHeight,
    coverHeight: scaledAHeight,
    coverStart,
    coverImageOffset: 0,
    effectStart,
    effectHeight: scaledBHeight,
    scaledAHeight,
    scaledBHeight,
    totalHeight,
    scaleA,
    scaleB,
  }
}

const normalizeImage = (image: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null) => {
  if (!image) return null
  return {
    width: image.processedWidth ?? image.width,
    height: image.processedHeight ?? image.height,
  }
}

const pickTargetWidth = (
  imageA: LayoutImageLike | (LayoutImageLike & { processedWidth?: number }) | null,
  imageB: LayoutImageLike | (LayoutImageLike & { processedWidth?: number }) | null,
) => {
  const widths = [imageA?.processedWidth ?? imageA?.width ?? 0, imageB?.processedWidth ?? imageB?.width ?? 0].filter((w) => w > 0)
  if (widths.length === 0) {
    return 1080
  }
  return Math.min(...widths)
}

export const calculateCompositePlan = (
  imageA: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null,
  imageB: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null,
  coverRatio: number,
): CompositePlan | null => {
  if (!imageA && !imageB) return null

  const targetWidth = pickTargetWidth(imageA, imageB)
  const normalizedA = normalizeImage(imageA)
  const normalizedB = normalizeImage(imageB)
  const layout = calculateCompositeLayout(normalizedA, normalizedB, targetWidth, coverRatio)

  return {
    targetWidth,
    targetHeight: layout.totalHeight,
    whiteTop: layout.whiteTop,
    whiteBottom: layout.whiteBottom,
    gapHeight: layout.gapHeight,
    coverHeight: layout.coverHeight,
    effectHeight: layout.effectHeight,
    coverStart: layout.coverStart,
    effectStart: layout.effectStart,
    contentWidth: targetWidth,
    sidePadding: 0,
    scaleFactor: 1,
  }
}

export const calculatePreviewLayout = (
  imageA: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null,
  imageB: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null,
  coverRatio: number,
  previewWidth: number,
): PreviewLayout => {
  const normalizedA = normalizeImage(imageA)
  const normalizedB = normalizeImage(imageB)
  const layout = calculateCompositeLayout(normalizedA, normalizedB, previewWidth, coverRatio)

  return {
    previewWidth,
    previewHeight: layout.totalHeight,
    whiteTop: layout.whiteTop,
    whiteBottom: layout.whiteBottom,
    gapHeight: layout.gapHeight,
    coverHeight: layout.coverHeight,
    effectHeight: layout.effectHeight,
    coverStart: layout.coverStart,
    effectStart: layout.effectStart,
  }
}
