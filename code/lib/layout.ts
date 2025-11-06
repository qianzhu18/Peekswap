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
