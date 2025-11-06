export interface LayoutImageLike {
  width: number
  height: number
}

export interface CompositeLayout {
  topHeight: number
  coverHeight: number
  bottomHeight: number
  innerHeight: number
  totalHeight: number
  scaledAHeight: number
  scaledBHeight: number
  coverImageOffset: number
  whitePadding: number
  scaleA: number
  scaleB: number
}

const WHITE_PADDING_WIDTH_MULTIPLIER = 1.75
const WHITE_PADDING_HEIGHT_RATIO = 0.85
const WHITE_PADDING_MIN = 720

const calculateWhitePadding = (innerHeight: number, targetWidth: number) => {
  if (innerHeight <= 0) {
    return 0
  }

  const fromWidth = Math.round(targetWidth * WHITE_PADDING_WIDTH_MULTIPLIER)
  const fromHeight = Math.round(innerHeight * WHITE_PADDING_HEIGHT_RATIO)

  return Math.max(WHITE_PADDING_MIN, fromWidth, fromHeight)
}

export const calculateCompositeLayout = (
  imageA: LayoutImageLike | null,
  imageB: LayoutImageLike | null,
  targetWidth: number,
  coverRatio: number,
): CompositeLayout => {
  if (!imageA && !imageB) {
    return {
      topHeight: 0,
      coverHeight: 0,
      bottomHeight: 0,
      innerHeight: 0,
      totalHeight: 0,
      scaledAHeight: 0,
      scaledBHeight: 0,
      coverImageOffset: 0,
      whitePadding: 0,
      scaleA: 0,
      scaleB: 0,
    }
  }

  const safeWidthA = imageA?.width ?? targetWidth
  const safeWidthB = imageB?.width ?? targetWidth
  const scaleA = imageA ? targetWidth / (safeWidthA || 1) : 0
  const scaleB = imageB ? targetWidth / (safeWidthB || 1) : 0

  const scaledAHeight = imageA ? Math.max(Math.round(imageA.height * scaleA), 0) : 0
  const scaledBHeight = imageB ? Math.max(Math.round(imageB.height * scaleB), 0) : 0

  let coverHeight = scaledAHeight
  if (imageB && scaledBHeight > 0) {
    const desiredCover = Math.max(Math.round(scaledBHeight * coverRatio), 40)
    coverHeight = Math.min(
      Math.max(desiredCover, scaledAHeight > 0 ? scaledAHeight : desiredCover),
      scaledBHeight,
    )
  }

  let topHeight = 0
  let bottomHeight = 0
  if (imageB && scaledBHeight > coverHeight) {
    const remaining = Math.max(scaledBHeight - coverHeight, 0)
    topHeight = Math.floor(remaining / 2)
    bottomHeight = remaining - topHeight
  }

  const innerHeight = Math.max(topHeight + coverHeight + bottomHeight, coverHeight)
  const whitePadding = imageB ? calculateWhitePadding(innerHeight, targetWidth) : 0
  const totalHeight = innerHeight + whitePadding * 2
  const coverImageOffset = imageA ? Math.round((coverHeight - scaledAHeight) / 2) : 0

  return {
    topHeight,
    coverHeight,
    bottomHeight,
    innerHeight,
    totalHeight,
    scaledAHeight,
    scaledBHeight,
    coverImageOffset,
    whitePadding,
    scaleA,
    scaleB,
  }
}

