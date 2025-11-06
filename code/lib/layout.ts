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
  scaledAHeight: number
  scaledBHeight: number
  totalHeight: number
  scaleA: number
  scaleB: number
}

const MIN_BOTTOM_PADDING_RATIO = 0.95
const MIN_BOTTOM_PADDING_PX = 480
const MIN_GAP_RATIO = 0.18
const MIN_GAP_PX = 160
const MIN_COVER_FROM_WIDTH_RATIO = 0.65
const MIN_COVER_NO_B_RATIO = 0.9
const EXTRA_TOP_RATIO = 1.6

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
      gapHeight: 0,
      coverHeight: 0,
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

  if (!imageB) {
    const coverBase = clampPositive(targetWidth * MIN_COVER_NO_B_RATIO)
    const coverHeight = Math.max(coverBase, scaledAHeight)
    const whitePadding = Math.max(
      clampPositive(targetWidth * (MIN_BOTTOM_PADDING_RATIO + 0.35)),
      MIN_BOTTOM_PADDING_PX,
    )

    const totalHeight = whitePadding * 2 + coverHeight
    const coverStart = whitePadding
    const coverImageOffset = imageA && scaledAHeight < coverHeight
      ? clampPositive((coverHeight - scaledAHeight) / 2)
      : 0

    return {
      whiteTop: whitePadding,
      whiteBottom: whitePadding,
      gapHeight: 0,
      coverHeight,
      coverStart,
      coverImageOffset,
      effectStart: 0,
      scaledAHeight,
      scaledBHeight: 0,
      totalHeight,
      scaleA,
      scaleB: 0,
    }
  }

  const minimumCover = Math.max(
    clampPositive(scaledBHeight * coverRatio),
    clampPositive(targetWidth * MIN_COVER_FROM_WIDTH_RATIO),
  )

  const coverHeight = imageA ? Math.max(minimumCover, scaledAHeight) : minimumCover

  const gapHeight = Math.max(
    clampPositive(targetWidth * MIN_GAP_RATIO),
    MIN_GAP_PX,
  )

  const minBottom = Math.max(
    clampPositive(targetWidth * MIN_BOTTOM_PADDING_RATIO),
    MIN_BOTTOM_PADDING_PX,
  )

  let whiteBottom = minBottom
  let whiteTop = whiteBottom + gapHeight + scaledBHeight

  const desiredTop = Math.max(
    whiteTop,
    clampPositive(targetWidth * (EXTRA_TOP_RATIO + 1)) + scaledBHeight,
  )

  if (desiredTop > whiteTop) {
    whiteTop = desiredTop
  }

  if (whiteTop - gapHeight - scaledBHeight > whiteBottom) {
    whiteBottom = whiteTop - gapHeight - scaledBHeight
  }

  const coverStart = whiteTop
  const effectStart = coverStart + coverHeight + gapHeight
  const totalHeight = whiteTop + coverHeight + gapHeight + scaledBHeight + whiteBottom

  const coverImageOffset = imageA && scaledAHeight < coverHeight
    ? clampPositive((coverHeight - scaledAHeight) / 2)
    : 0

  return {
    whiteTop,
    whiteBottom,
    gapHeight,
    coverHeight,
    coverStart,
    coverImageOffset,
    effectStart,
    scaledAHeight,
    scaledBHeight,
    totalHeight,
    scaleA,
    scaleB,
  }
}

