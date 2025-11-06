export interface LayoutImageLike {
  width: number
  height: number
}

export interface CompositeLayout {
  whiteTop: number
  whiteBottom: number
  topHeight: number
  coverHeight: number
  bottomHeight: number
  coverStart: number
  coverImageOffset: number
  effectStart: number
  scaledAHeight: number
  scaledBHeight: number
  totalHeight: number
  scaleA: number
  scaleB: number
}

const WHITE_PADDING_RATIO = 0.95
const WHITE_PADDING_MIN = 360
const MIN_COVER_RATIO = 0.6
const MIN_COVER_PX = 120

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

  const whitePadding = Math.max(
    clampPositive(targetWidth * WHITE_PADDING_RATIO),
    WHITE_PADDING_MIN,
  )

  if (!imageB || scaledBHeight === 0) {
    const coverBase = Math.max(
      clampPositive(targetWidth * MIN_COVER_RATIO),
      MIN_COVER_PX,
    )
    const coverHeight = Math.max(coverBase, scaledAHeight)
    const totalHeight = whitePadding * 2 + coverHeight
    const coverStart = whitePadding
    const coverImageOffset = imageA && scaledAHeight < coverHeight
      ? clampPositive((coverHeight - scaledAHeight) / 2)
      : 0

    return {
      whiteTop: whitePadding,
      whiteBottom: whitePadding,
      topHeight: 0,
      coverHeight,
      bottomHeight: 0,
      coverStart,
      coverImageOffset,
      effectStart: coverStart + coverHeight,
      scaledAHeight,
      scaledBHeight: 0,
      totalHeight,
      scaleA,
      scaleB: 0,
    }
  }

  const desiredCoverFromRatio = clampPositive(scaledBHeight * coverRatio)
  const minimumCover = Math.max(
    desiredCoverFromRatio,
    clampPositive(targetWidth * MIN_COVER_RATIO),
    MIN_COVER_PX,
  )

  const coverHeight = Math.min(Math.max(minimumCover, scaledAHeight), scaledBHeight)
  const remaining = Math.max(scaledBHeight - coverHeight, 0)
  const topHeight = Math.floor(remaining / 2)
  const bottomHeight = remaining - topHeight

  const whiteTop = whitePadding
  const whiteBottom = whitePadding
  const coverStart = whiteTop + topHeight
  const effectStart = whiteTop
  const totalHeight = whiteTop + topHeight + coverHeight + bottomHeight + whiteBottom

  const coverImageOffset = imageA && scaledAHeight < coverHeight
    ? clampPositive((coverHeight - scaledAHeight) / 2)
    : 0

  return {
    whiteTop,
    whiteBottom,
    topHeight,
    coverHeight,
    bottomHeight,
    coverStart,
    coverImageOffset,
    effectStart: coverStart + coverHeight,
    scaledAHeight,
    scaledBHeight,
    totalHeight,
    scaleA,
    scaleB,
  }
}
