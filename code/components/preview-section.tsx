"use client"

import { useMemo, type CSSProperties } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import useImageStore from "@/lib/store"

interface PreviewSectionProps {
  activeTab: "preview" | "full"
  onTabChange: (tab: "preview" | "full") => void
}

interface LayoutResult {
  topHeight: number
  coverHeight: number
  bottomHeight: number
  totalHeight: number
  scaledAHeight: number
  coverImageOffset: number
  scaledBHeight: number
}

const computeLayout = (
  imageA: { width: number; height: number } | null,
  imageB: { width: number; height: number } | null,
  targetWidth: number,
  coverRatio: number,
): LayoutResult => {
  if (!imageA && !imageB) {
    return { topHeight: 0, coverHeight: 0, bottomHeight: 0, totalHeight: 0, scaledAHeight: 0, coverImageOffset: 0, scaledBHeight: 0 }
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
    coverHeight = Math.min(Math.max(desiredCover, scaledAHeight), scaledBHeight)
  }

  let topHeight = 0
  let bottomHeight = 0
  if (imageB && scaledBHeight > coverHeight) {
    const remaining = Math.max(scaledBHeight - coverHeight, 0)
    topHeight = Math.floor(remaining / 2)
    bottomHeight = remaining - topHeight
  }

  const totalHeight = Math.max(topHeight + coverHeight + bottomHeight, coverHeight)
  const coverImageOffset = imageA ? Math.round((coverHeight - scaledAHeight) / 2) : 0

  return {
    topHeight,
    coverHeight,
    bottomHeight,
    totalHeight,
    scaledAHeight,
    coverImageOffset,
    scaledBHeight,
  }
}

export default function PreviewSection({ activeTab, onTabChange }: PreviewSectionProps) {
  const { imageA, imageB, coverRatio } = useImageStore()

  const previewWidth = 288
  const previewWindowHeight = 360

  const layout = useMemo(() => computeLayout(imageA, imageB, previewWidth, coverRatio), [imageA, imageB, coverRatio])
  const centerOffset = Math.max(layout.totalHeight / 2 - previewWindowHeight / 2, 0)

  const renderComposite = (isPreviewWindow: boolean) => {
    if (!imageA && !imageB) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <p className="text-gray-600 text-sm">等待上传...</p>
        </div>
      )
    }

    if (!imageB) {
      return imageA ? (
        <img src={imageA.url} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <p className="text-gray-600 text-sm">等待封面...</p>
        </div>
      )
    }

    const containerStyle: CSSProperties = {
      width: `${previewWidth}px`,
    }

    if (isPreviewWindow) {
      Object.assign(containerStyle, {
        height: `${previewWindowHeight}px`,
        border: "8px solid rgba(255, 228, 92, 0.3)",
      })
    } else {
      Object.assign(containerStyle, {
        border: "8px solid rgba(47, 240, 181, 0.3)",
        maxHeight: "600px",
      })
    }

    return (
      <div
        className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl mx-auto"
        style={containerStyle}
      >
        <div
          className="w-full"
          style={{
            height: `${layout.totalHeight}px`,
            transform: isPreviewWindow ? `translateY(-${centerOffset}px)` : undefined,
            transition: "transform 0.2s ease",
          }}
        >
          {layout.topHeight > 0 && (
            <img
              src={imageB.url}
              alt="Effect top"
              className="w-full"
              style={{
                height: `${layout.topHeight}px`,
                objectFit: "cover",
                objectPosition: "top center",
              }}
            />
          )}

          {layout.coverHeight > 0 && (
            <div className="relative w-full overflow-hidden" style={{ height: `${layout.coverHeight}px` }}>
              <img
                src={imageB.url}
                alt="Effect middle"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center" }}
              />
              {imageA && (
                <img
                  src={imageA.url}
                  alt="Cover"
                  className="absolute left-0 w-full"
                  style={{
                    height: "auto",
                    top: `${layout.coverImageOffset}px`,
                  }}
                />
              )}
            </div>
          )}

          {layout.bottomHeight > 0 && (
            <img
              src={imageB.url}
              alt="Effect bottom"
              className="w-full"
              style={{
                height: `${layout.bottomHeight}px`,
                objectFit: "cover",
                objectPosition: "bottom center",
              }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 md:px-0 py-4 md:py-0">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "preview" | "full")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur">
          <TabsTrigger value="preview" className="data-[state=active]:bg-[#FFE45C] data-[state=active]:text-[#1C1542]">
            好友预览
          </TabsTrigger>
          <TabsTrigger value="full" className="data-[state=active]:bg-[#2FF0B5] data-[state=active]:text-[#1C1542]">
            彩蛋全貌
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="preview" className="mt-0">
            <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl flex justify-center">
              {renderComposite(true)}
            </Card>
          </TabsContent>

          <TabsContent value="full" className="mt-0">
            <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl flex justify-center">
              <div className="max-h-[600px] overflow-y-auto">{renderComposite(false)}</div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
