export interface LayoutImageLike {
  width: number
  height: number
  processedWidth?: number
  processedHeight?: number
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
  contentWidth: number
  sidePadding: number
}

const WIDTH_CANDIDATES = [1080, 1242, 1440]
const DEFAULT_RATIO = 16 / 9
const COVER_RATIO_MIN = 0.25
const COVER_RATIO_MAX = 0.55
const GAP_RATIO_RANGE = [0.45, 0.8]
const BOTTOM_WHITE_RATIO_RANGE = [1.2, 2.3]
const MAX_TARGET_HEIGHT = 6200
const MIN_CONTENT_WIDTH = 320

const clampPositive = (value: number) => Math.max(0, Math.round(value))

const normalizeImage = (image: LayoutImageLike | null) => {
  if (!image) return null
  const width = image.processedWidth ?? image.width
  const height = image.processedHeight ?? image.height
  if (width <= 0 || height <= 0) return null
  return { width, height }
}

const scaleHeightToWidth = (image: { width: number; height: number }, targetWidth: number) => {
  return Math.max(1, Math.round((image.height * targetWidth) / image.width))
}

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  if (inMax === inMin) return outMin
  const clamped = Math.min(Math.max(value, inMin), inMax)
  const ratio = (clamped - inMin) / (inMax - inMin)
  return outMin + ratio * (outMax - outMin)
}

const buildPlanForWidth = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
  coverRatio: number,
  targetWidth: number,
): CompositePlan | null => {
  const normalizedA = normalizeImage(imageA)
  const normalizedB = normalizeImage(imageB)
  if (!normalizedA && !normalizedB) {
    return null
  }

  const hasA = !!normalizedA
  const hasB = !!normalizedB

  let contentWidth = targetWidth
  if (contentWidth < MIN_CONTENT_WIDTH) {
    contentWidth = MIN_CONTENT_WIDTH
  }

  const coverHeight = hasA ? scaleHeightToWidth(normalizedA!, contentWidth) : 0
  const effectHeight = hasB ? scaleHeightToWidth(normalizedB!, contentWidth) : 0

  const coverControl = Math.min(Math.max(coverRatio || COVER_RATIO_MIN, COVER_RATIO_MIN), COVER_RATIO_MAX)
  const gapRatio = mapRange(coverControl, COVER_RATIO_MIN, COVER_RATIO_MAX, GAP_RATIO_RANGE[0], GAP_RATIO_RANGE[1])
  const bottomRatio = mapRange(
    coverControl,
    COVER_RATIO_MIN,
    COVER_RATIO_MAX,
    BOTTOM_WHITE_RATIO_RANGE[0],
    BOTTOM_WHITE_RATIO_RANGE[1],
  )

  const topWhite = hasA ? 0 : Math.round(contentWidth * 0.05)
  const gapHeight = hasA && hasB ? Math.max(40, Math.round(effectHeight * gapRatio)) : 0
  const bottomWhiteBase = hasB ? Math.round(effectHeight * bottomRatio) : Math.round(contentWidth * 0.8)
  const bottomWhite = Math.max(Math.round(contentWidth * 0.6), bottomWhiteBase)

  let targetHeight = topWhite + coverHeight + gapHeight + effectHeight + bottomWhite
  let scaleFactor = 1
  if (targetHeight > MAX_TARGET_HEIGHT) {
    scaleFactor = MAX_TARGET_HEIGHT / targetHeight
    targetHeight = MAX_TARGET_HEIGHT
  }

  const scaleValue = (value: number) => {
    if (value <= 0) return 0
    return Math.max(1, Math.round(value * scaleFactor))
  }

  const scaledTopWhite = scaleValue(topWhite)
  const scaledCoverHeight = scaleValue(coverHeight)
  const scaledGapHeight = scaleValue(gapHeight)
  const scaledEffectHeight = scaleValue(effectHeight)
  const scaledBottomWhite = scaleValue(bottomWhite)
  const scaledWidth = Math.max(MIN_CONTENT_WIDTH, scaleValue(contentWidth))

  return {
    targetWidth: scaledWidth,
    targetHeight,
    whiteTop: scaledTopWhite,
    whiteBottom: scaledBottomWhite,
    gapHeight: scaledGapHeight,
    coverHeight: scaledCoverHeight,
    effectHeight: scaledEffectHeight,
    coverStart: scaledTopWhite,
    effectStart: scaledTopWhite + scaledCoverHeight + scaledGapHeight,
    contentWidth: scaledWidth,
    sidePadding: 0,
    scaleFactor,
  }
}

export const calculateCompositePlan = (
  imageA: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null,
  imageB: LayoutImageLike | (LayoutImageLike & { processedWidth?: number; processedHeight?: number }) | null,
  coverRatio: number,
): CompositePlan | null => {
  for (let i = 0; i < WIDTH_CANDIDATES.length; i++) {
    const width = WIDTH_CANDIDATES[i]
    const plan = buildPlanForWidth(imageA, imageB, coverRatio, width)
    if (plan) {
      return plan
    }
  }
  return null
}

export const calculatePreviewLayout = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
  coverRatio: number,
  previewWidth: number,
): PreviewLayout => {
  const plan = calculateCompositePlan(imageA, imageB, coverRatio)
  if (!plan) {
    const previewHeight = Math.round(previewWidth * DEFAULT_RATIO)
    return {
      previewWidth,
      previewHeight,
      whiteTop: 0,
      whiteBottom: 0,
      gapHeight: 0,
      coverHeight: 0,
      effectHeight: 0,
      coverStart: 0,
      effectStart: 0,
      contentWidth: previewWidth,
      sidePadding: 0,
    }
  }

  const scale = previewWidth / plan.targetWidth
  return {
    previewWidth,
    previewHeight: plan.targetHeight * scale,
    whiteTop: plan.whiteTop * scale,
    whiteBottom: plan.whiteBottom * scale,
    gapHeight: plan.gapHeight * scale,
    coverHeight: plan.coverHeight * scale,
    effectHeight: plan.effectHeight * scale,
    coverStart: plan.coverStart * scale,
    effectStart: plan.effectStart * scale,
    contentWidth: plan.contentWidth * scale,
    sidePadding: plan.sidePadding * scale,
  }
}

export const calculateCompositeLayout = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
  targetWidth: number,
  coverRatio: number,
): CompositeLayout => {
  const normalizedA = normalizeImage(imageA)
  const normalizedB = normalizeImage(imageB)
  const plan = buildPlanForWidth(normalizedA, normalizedB, coverRatio, targetWidth) ?? {
    targetWidth,
    targetHeight: Math.round(targetWidth * DEFAULT_RATIO),
    whiteTop: 0,
    whiteBottom: 0,
    gapHeight: 0,
    coverHeight: 0,
    effectHeight: 0,
    coverStart: 0,
    effectStart: 0,
    contentWidth: targetWidth,
    sidePadding: 0,
    scaleFactor: 1,
  }

  const scaleA = normalizedA ? (plan.contentWidth / normalizedA.width) : 0
  const scaleB = normalizedB ? (plan.contentWidth / normalizedB.width) : 0

  return {
    whiteTop: plan.whiteTop,
    whiteBottom: plan.whiteBottom,
    gapHeight: plan.gapHeight,
    coverHeight: plan.coverHeight,
    coverStart: plan.coverStart,
    coverImageOffset: 0,
    effectStart: plan.effectStart,
    effectHeight: plan.effectHeight,
    scaledAHeight: plan.coverHeight,
    scaledBHeight: plan.effectHeight,
    totalHeight: plan.targetHeight,
    scaleA,
    scaleB,
  }
}
