"use client"

import { useMemo, type CSSProperties } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import useImageStore from "@/lib/store"
import { calculatePreviewLayout } from "@/lib/layout"

const CONTACT_QR_URL = "/contact-qr.jpg"
const WATERMARK_WIDTH_RATIO = 0.32
const WATERMARK_TEXT =
  "如果你觉得好玩有趣，欢迎联系网站的开发作者，提供你的好玩有趣的小点子，我们一起交流~"
const WATERMARK_SUBTEXT = "保持原图比例，扫码即可加作者"

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
    const total = layout.whiteTop + layout.effectHeight + layout.gapHeight + layout.coverHeight + layout.whiteBottom
    if (!total) return []
    const segments: { label: string; value: number }[] = []
    if (layout.whiteTop > 0) segments.push({ label: "顶部白底", value: layout.whiteTop })
    if (layout.effectHeight > 0) segments.push({ label: "隐藏图", value: layout.effectHeight })
    if (layout.gapHeight > 0) segments.push({ label: "白底间隔", value: layout.gapHeight })
    if (layout.coverHeight > 0) segments.push({ label: "展示图", value: layout.coverHeight })
    if (layout.whiteBottom > 0) segments.push({ label: "底部白底", value: layout.whiteBottom })
    return segments.map((segment) => ({
      ...segment,
      percent: Math.round((segment.value / total) * 10000) / 100,
    }))
  }, [layout.coverHeight, layout.effectHeight, layout.gapHeight, layout.whiteBottom, layout.whiteTop])

  const buildWatermarkBox = () => {
    if (!layout.whiteBottom || layout.contentWidth <= 0) return null
    const padding = Math.min(24, layout.whiteBottom * 0.2)
    const qrWidth = Math.min(layout.contentWidth * WATERMARK_WIDTH_RATIO, layout.whiteBottom * 0.45)
    const heightLimit = layout.whiteBottom - padding * 2
    if (qrWidth <= 0 || heightLimit <= 0) return null
    const qrHeight = Math.min(qrWidth, heightLimit * 0.6)
    const bottom = padding
    const left = layout.sidePadding
    return { qrWidth, qrHeight, left, bottom }
  }

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

    const renderHidden = () => {
      if (!layout.effectHeight) {
        return null
      }

      if (!imageA) {
        return (
          <div
            className="flex items-center justify-center text-gray-500 text-sm"
            style={{ height: `${layout.effectHeight}px`, backgroundColor: "#ffffff" }}
          >
            等待隐藏图...
          </div>
        )
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
            src={imageA.url}
            alt="Hidden"
            className="h-full object-cover"
            style={{
              width: `${layout.contentWidth}px`,
              objectPosition: "center",
            }}
          />
        </div>
      )
    }

    const renderCover = () => {
      if (!layout.coverHeight) {
        return null
      }

      if (!imageB) {
        return (
          <div
            className="flex items-center justify-center text-gray-500 text-sm"
            style={{ height: `${layout.coverHeight}px`, backgroundColor: "#ffffff" }}
          >
            等待封面图...
          </div>
        )
      }

      return (
        <div
          style={{
            width: `${layout.contentWidth}px`,
            height: `${layout.coverHeight}px`,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={imageB.url}
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

          {renderHidden()}

          {layout.gapHeight > 0 && layout.coverHeight > 0 && layout.effectHeight > 0 && (
            <div style={{ height: `${layout.gapHeight}px`, backgroundColor: "#ffffff" }} />
          )}

          {renderCover()}

          {layout.whiteBottom > 0 && (
            <div
              style={{
                height: `${layout.whiteBottom}px`,
                backgroundColor: "#ffffff",
                position: "relative",
              }}
            >
              {(() => {
                const box = buildWatermarkBox()
                if (!box) return null
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${box.left}px`,
                      bottom: `${box.bottom}px`,
                      width: `${layout.contentWidth}px`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px",
                    }}
                  >
                    <img
                      src={CONTACT_QR_URL}
                      alt="作者联系二维码"
                      style={{
                        width: `${box.qrWidth}px`,
                        height: `${box.qrHeight}px`,
                        objectFit: "contain",
                        borderRadius: "12px",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    />
                    <p
                      style={{
                        color: "#4b5563",
                        fontSize: `${Math.max(10, Math.min(14, layout.contentWidth * 0.03))}px`,
                        textAlign: "center",
                        maxWidth: `${layout.contentWidth * 0.9}px`,
                        lineHeight: 1.35,
                        margin: 0,
                        padding: 0,
                        wordBreak: "break-word",
                      }}
                    >
                      {WATERMARK_TEXT}
                    </p>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: `${Math.max(9, Math.min(12, layout.contentWidth * 0.026))}px`,
                        textAlign: "center",
                        maxWidth: `${layout.contentWidth * 0.85}px`,
                        lineHeight: 1.35,
                        margin: 0,
                        padding: 0,
                        wordBreak: "break-word",
                      }}
                    >
                      {WATERMARK_SUBTEXT}
                    </p>
                  </div>
                )
              })()}
            </div>
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
