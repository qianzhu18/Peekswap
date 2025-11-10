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

const TARGET_RATIO = 16 / 9
const WIDTH_CANDIDATES = [1080, 1242, 1440]
const TOP_WHITE_RATIO_MIN = 0.25
const TOP_WHITE_RATIO_MAX = 0.6
const BOTTOM_WHITE_RATIO = 0.15
const GAP_BASE = 40
const MIN_SCALE = 0.05

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

  const targetHeight = Math.round(targetWidth * TARGET_RATIO)
  const hasA = !!normalizedA
  const hasB = !!normalizedB

  let coverHeight = hasA ? scaleHeightToWidth(normalizedA!, targetWidth) : 0
  let effectHeight = hasB ? scaleHeightToWidth(normalizedB!, targetWidth) : 0

  const coverControl = Math.min(Math.max(coverRatio || TOP_WHITE_RATIO_MIN, TOP_WHITE_RATIO_MIN), TOP_WHITE_RATIO_MAX)
  const topWhiteMin = hasA ? Math.round(targetHeight * coverControl) : Math.round(targetHeight * 0.1)
  const bottomWhiteMin = hasB ? Math.round(targetHeight * BOTTOM_WHITE_RATIO) : Math.round(targetHeight * 0.1)

  let topWhite = topWhiteMin
  let bottomWhite = bottomWhiteMin
  let gapHeight = hasA && hasB ? Math.max(0, Math.round(GAP_BASE * (0.5 + (coverControl - 0.4) * 1.5))) : 0
  let scaleFactor = 1
  let contentWidth = targetWidth
  let sidePadding = 0

  const contentHeight = () => coverHeight + gapHeight + effectHeight
  const totalHeight = () => topWhite + contentHeight() + bottomWhite

  const reduceGapIfNeeded = () => {
    if (gapHeight === 0) return
    const excess = totalHeight() - targetHeight
    if (excess > 0) {
      const reduction = Math.min(excess, gapHeight)
      gapHeight -= reduction
    }
  }

  reduceGapIfNeeded()

  if (totalHeight() > targetHeight) {
    const available = targetHeight - topWhite - bottomWhite - gapHeight
    const content = coverHeight + effectHeight
    if (available <= 0 || content <= 0) {
      return null
    }
    scaleFactor = Math.max(available / content, MIN_SCALE)
    coverHeight = Math.max(1, Math.round(coverHeight * scaleFactor))
    effectHeight = Math.max(1, Math.round(effectHeight * scaleFactor))
    contentWidth = Math.max(1, Math.round(targetWidth * scaleFactor))
    sidePadding = Math.max(0, Math.floor((targetWidth - contentWidth) / 2))
  }

  if (totalHeight() < targetHeight) {
    const deficit = targetHeight - totalHeight()
    const topExtra = Math.round(deficit * 0.7)
    topWhite += topExtra
    bottomWhite += deficit - topExtra
  }

  return {
    targetWidth,
    targetHeight,
    whiteTop: topWhite,
    whiteBottom: bottomWhite,
    gapHeight,
    coverHeight,
    effectHeight,
    coverStart: topWhite,
    effectStart: topWhite + coverHeight + gapHeight,
    contentWidth,
    sidePadding,
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
    if (!plan) continue
    if (plan.scaleFactor >= MIN_SCALE || i === WIDTH_CANDIDATES.length - 1) {
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
    const previewHeight = Math.round(previewWidth * TARGET_RATIO)
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
    targetHeight: Math.round(targetWidth * TARGET_RATIO),
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
