"use client"

import { useMemo, type CSSProperties } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import useImageStore from "@/lib/store"
import { calculateCompositeLayout } from "@/lib/layout"

interface PreviewSectionProps {
  activeTab: "preview" | "full"
  onTabChange: (tab: "preview" | "full") => void
}

export default function PreviewSection({ activeTab, onTabChange }: PreviewSectionProps) {
  const { imageA, imageB, coverRatio } = useImageStore()

  const previewWidth = 288
  const previewWindowHeight = 288

  const layout = useMemo(
    () => calculateCompositeLayout(imageA, imageB, previewWidth, coverRatio),
    [imageA, imageB, coverRatio],
  )
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
        <div className="w-full h-full bg-white flex items-center justify-center">
          <img src={imageA.url} alt="Cover" className="max-w-full max-h-full object-contain" />
        </div>
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
            backgroundColor: "#ffffff",
          }}
        >
          {layout.whitePadding > 0 && (
            <div
              style={{
                width: "100%",
                height: `${layout.whitePadding}px`,
                backgroundColor: "#ffffff",
              }}
            />
          )}

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

          {layout.whitePadding > 0 && (
            <div
              style={{
                width: "100%",
                height: `${layout.whitePadding}px`,
                backgroundColor: "#ffffff",
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
