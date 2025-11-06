"use client"

import { useMemo, type CSSProperties } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import useImageStore from "@/lib/store"
import { calculatePreviewLayout } from "@/lib/layout"

interface PreviewSectionProps {
  activeTab: "preview" | "full"
  onTabChange: (tab: "preview" | "full") => void
}

export default function PreviewSection({ activeTab, onTabChange }: PreviewSectionProps) {
  const { imageA, imageB, coverRatio } = useImageStore()

  const previewWidth = 288
  const previewWindowHeight = 288

  const layout = useMemo(
    () => calculatePreviewLayout(imageA, imageB, coverRatio, previewWidth),
    [imageA, imageB, coverRatio],
  )
  const centerOffset = Math.max(layout.previewHeight / 2 - previewWindowHeight / 2, 0)
  const segmentBreakdown = useMemo(() => {
    const total = layout.whiteTop + layout.coverHeight + layout.gapHeight + layout.effectHeight + layout.whiteBottom
    if (!total) return []
    const segments: { label: string; value: number }[] = []
    if (layout.coverHeight > 0) segments.push({ label: "第一张图片", value: layout.coverHeight })
    if (layout.gapHeight > 0) segments.push({ label: "白底间隔", value: layout.gapHeight })
    if (layout.effectHeight > 0) segments.push({ label: "第二张图片", value: layout.effectHeight })
    if (layout.whiteBottom > 0) segments.push({ label: "底部白底", value: layout.whiteBottom })
    return segments.map((segment) => ({
      ...segment,
      percent: Math.round((segment.value / total) * 10000) / 100,
    }))
  }, [layout.coverHeight, layout.effectHeight, layout.gapHeight, layout.whiteBottom, layout.whiteTop])

  const renderComposite = (isPreviewWindow: boolean) => {
    if (!imageA && !imageB) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <p className="text-gray-600 text-sm">等待上传...</p>
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

    const renderCover = () => {
      if (!layout.coverHeight) {
        return null
      }

      if (!imageA) {
        return (
          <div
            className="flex items-center justify-center text-gray-500 text-sm"
            style={{ height: `${layout.coverHeight}px`, backgroundColor: "#ffffff" }}
          >
            等待封面...
          </div>
        )
      }

      return (
        <div
          style={{
            width: `${previewWidth}px`,
            height: `${layout.coverHeight}px`,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={imageA.url}
            alt="Cover"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>
      )
    }

    const renderEffect = () => {
      if (!imageB || !layout.effectHeight) {
        return null
      }

      return (
        <div
          className="w-full"
          style={{
            height: `${layout.effectHeight}px`,
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src={imageB.url}
            alt="Effect"
            className="h-full object-cover"
            style={{
              width: `${previewWidth}px`,
              objectPosition: "center",
            }}
          />
        </div>
      )
    }

    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl mx-auto" style={containerStyle}>
        <div
          className="w-full"
          style={{
            height: `${layout.previewHeight}px`,
            transform: isPreviewWindow ? `translateY(-${centerOffset}px)` : undefined,
            transition: "transform 0.2s ease",
            backgroundColor: "#ffffff",
          }}
        >
          {layout.whiteTop > 0 && (
            <div
              style={{
                height: `${layout.whiteTop}px`,
                backgroundColor: "#ffffff",
              }}
            />
          )}

          {renderCover()}

          {layout.gapHeight > 0 && layout.effectHeight > 0 && (
            <div style={{ height: `${layout.gapHeight}px`, backgroundColor: "#ffffff" }} />
          )}

          {renderEffect()}

          {layout.whiteBottom > 0 && (
            <div
              style={{
                height: `${layout.whiteBottom}px`,
                backgroundColor: "#ffffff",
              }}
            />
          )}
        </div>
        {segmentBreakdown.length > 0 && (
          <div className="px-4 py-3 bg-black/20 text-xs text-gray-300 space-y-1">
            <p className="text-gray-400">分段高度参考（预览尺寸）</p>
            {segmentBreakdown.map((segment) => (
              <div key={segment.label} className="flex justify-between">
                <span>{segment.label}</span>
                <span>
                  {Math.round(segment.value)} px · {segment.percent}%
                </span>
              </div>
            ))}
          </div>
        )}
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
