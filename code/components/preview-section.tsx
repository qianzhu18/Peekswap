"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import useImageStore from "@/lib/store"

interface PreviewSectionProps {
  activeTab: "preview" | "full"
  onTabChange: (tab: "preview" | "full") => void
}

export default function PreviewSection({ activeTab, onTabChange }: PreviewSectionProps) {
  const { imageA, imageB, whiteBarHeight } = useImageStore()

  // 预览宽度固定为移动端适配尺寸
  const previewWidth = 288
  const previewWindowHeight = 360

  const imgADisplayHeight = useMemo(() => {
    if (!imageA) return 300
    const ratio = imageA.height / imageA.width
    return Math.round(previewWidth * ratio)
  }, [imageA])

  const imgBDisplayHeight = useMemo(() => {
    if (!imageB) return 0
    const ratio = imageB.height / imageB.width
    return Math.round(previewWidth * ratio)
  }, [imageB])

  // 白底区域计算逻辑需与合成保持一致
  const paddingTop = whiteBarHeight
  const paddingBetween = whiteBarHeight
  const paddingBottom = paddingTop + imgADisplayHeight + paddingBetween
  const totalHeight = paddingTop + imgADisplayHeight + paddingBetween + imgBDisplayHeight + paddingBottom
  const centerOffset = Math.max(totalHeight / 2 - previewWindowHeight / 2, 0)

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
          {/* 好友预览 - 显示固定高度360px的中间区域 */}
          <TabsContent value="preview" className="mt-0">
            <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl">
              <div className="flex justify-center">
                <div
                  className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewWindowHeight}px`,
                    border: "8px solid rgba(255, 228, 92, 0.3)",
                  }}
                >
                  {imageA && imageB ? (
                    <div className="relative w-full h-full overflow-hidden bg-white">
                      <div
                        className="w-full"
                        style={{
                          height: `${totalHeight}px`,
                          transform: `translateY(-${centerOffset}px)`,
                        }}
                      >
                        <div className="bg-white" style={{ height: `${paddingTop}px` }} />
                        <img
                          src={imageA.url || "/placeholder.svg"}
                          alt="Cover preview"
                          className="w-full"
                          style={{
                            height: `${imgADisplayHeight}px`,
                            objectFit: "cover",
                          }}
                        />
                        <div className="bg-white" style={{ height: `${paddingBetween}px` }} />
                        <img
                          src={imageB.url || "/placeholder.svg"}
                          alt="Effect preview"
                          className="w-full"
                          style={{
                            height: `${imgBDisplayHeight}px`,
                            objectFit: "cover",
                          }}
                        />
                        <div className="bg-white" style={{ height: `${paddingBottom}px` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <p className="text-gray-600 text-sm">等待封面...</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 彩蛋全貌 - 显示完整的三层结构 */}
          <TabsContent value="full" className="mt-0">
            <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl">
              <div className="flex justify-center max-h-[600px] overflow-y-auto">
                <div
                  className="rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    width: `${previewWidth}px`,
                    border: "8px solid rgba(47, 240, 181, 0.3)",
                  }}
                >
                  {imageA && imageB ? (
                    <div className="w-full">
                      <div className="bg-white" style={{ height: `${paddingTop}px` }} />
                      <img
                        src={imageA.url || "/placeholder.svg"}
                        alt="Cover"
                        className="w-full"
                        style={{
                          height: `${imgADisplayHeight}px`,
                          objectFit: "cover",
                        }}
                      />
                      <div className="bg-white" style={{ height: `${paddingBetween}px` }} />
                      <img
                        src={imageB.url || "/placeholder.svg"}
                        alt="Menu"
                        className="w-full"
                        style={{
                          height: `${imgBDisplayHeight}px`,
                          objectFit: "cover",
                        }}
                      />
                      <div className="bg-white" style={{ height: `${paddingBottom}px` }} />
                    </div>
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <p className="text-gray-600 text-sm text-center px-4">
                        {!imageA ? "先放封面哄他" : "再塞彩蛋炸他"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
