export interface LayoutImageLike {
  width: number
  height: number
  processedWidth?: number
  processedHeight?: number
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
const GAP_BASE = 40
const MIN_SCALE = 0.75
const WHITE_BOTTOM_RATIO = 1.1
const WHITE_PADDING_MIN = 420
const GAP_RATIO = 0.24
const GAP_MIN = 160

const clampPositive = (value: number) => Math.max(0, Math.round(value))

const buildPlanForWidth = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
  coverRatio: number,
  targetWidth: number,
): CompositePlan | null => {
  const targetHeight = Math.round(targetWidth * TARGET_RATIO)

  const processedAWidth = imageA?.processedWidth ?? imageA?.width ?? targetWidth
  const processedAHeight = imageA?.processedHeight ?? imageA?.height ?? 0
  const processedBWidth = imageB?.processedWidth ?? imageB?.width ?? targetWidth
  const processedBHeight = imageB?.processedHeight ?? imageB?.height ?? 0

  const scaleA = imageA ? targetWidth / processedAWidth : 0
  const scaleB = imageB ? targetWidth / processedBWidth : 0

  let coverHeight = imageA ? Math.max(1, Math.round(processedAHeight * scaleA)) : 0
  let effectHeight = imageB ? Math.max(1, Math.round(processedBHeight * scaleB)) : 0

  let gapHeight = imageA && imageB ? Math.round(GAP_BASE * (0.4 + coverRatio)) : 0
  const additionalGap = imageA && imageB
    ? Math.max(clampPositive(targetWidth * GAP_RATIO), GAP_MIN)
    : 0
  gapHeight = Math.max(gapHeight, additionalGap)

  let scaleFactor = 1
  let contentWidth = targetWidth
  let sidePadding = 0

  const reduceGapIfNeeded = () => {
    const contentHeight = coverHeight + gapHeight + effectHeight
    if (contentHeight > targetHeight) {
      const extra = contentHeight - targetHeight
      gapHeight = Math.max(0, gapHeight - extra)
    }
  }

  reduceGapIfNeeded()

  let contentHeight = coverHeight + gapHeight + effectHeight

  if (contentHeight > targetHeight) {
    scaleFactor = targetHeight / contentHeight
    coverHeight = Math.max(1, Math.round(coverHeight * scaleFactor))
    effectHeight = Math.max(1, Math.round(effectHeight * scaleFactor))
    gapHeight = Math.round(gapHeight * scaleFactor)
    contentWidth = Math.max(1, Math.round(targetWidth * scaleFactor))
    sidePadding = Math.max(0, Math.floor((targetWidth - contentWidth) / 2))
    contentHeight = coverHeight + gapHeight + effectHeight
  }

  const whiteBottomBase = Math.max(
    clampPositive(targetWidth * WHITE_BOTTOM_RATIO),
    WHITE_PADDING_MIN,
  )

  let whiteBottom = whiteBottomBase

  if (contentHeight < targetHeight) {
    const desired = (targetHeight - coverHeight - 2 * (gapHeight + effectHeight)) / 2
    whiteBottom = Math.max(whiteBottomBase, Math.round(desired))
  }

  let whiteTop = whiteBottom + gapHeight + effectHeight
  let totalHeight = whiteTop + coverHeight + gapHeight + effectHeight + whiteBottom

  if (totalHeight < targetHeight) {
    const deficit = targetHeight - totalHeight
    whiteBottom += deficit
    whiteTop = whiteBottom + gapHeight + effectHeight
    totalHeight = whiteTop + coverHeight + gapHeight + effectHeight + whiteBottom
  } else if (totalHeight > targetHeight) {
    const overflow = totalHeight - targetHeight
    const reduction = Math.min(overflow, whiteBottom)
    whiteBottom -= reduction
    whiteTop = whiteBottom + gapHeight + effectHeight
    totalHeight = whiteTop + coverHeight + gapHeight + effectHeight + whiteBottom
    if (totalHeight > targetHeight) {
      const remain = totalHeight - targetHeight
      whiteBottom = Math.max(0, whiteBottom - remain)
      whiteTop = whiteBottom + gapHeight + effectHeight
      totalHeight = whiteTop + coverHeight + gapHeight + effectHeight + whiteBottom
    }
  }

  return {
    targetWidth,
    targetHeight,
    whiteTop,
    whiteBottom,
    gapHeight,
    coverHeight,
    effectHeight,
    coverStart: whiteTop,
    effectStart: whiteTop + coverHeight + gapHeight,
    contentWidth,
    sidePadding,
    scaleFactor,
  }
}

export const calculateCompositePlan = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
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
    const previewHeight = previewWidth * TARGET_RATIO
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
