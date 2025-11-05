"use client"

import { useState } from "react"
import Header from "@/components/header"
import PreviewSection from "@/components/preview-section"
import UploadSection from "@/components/upload-section"
import ParameterSection from "@/components/parameter-section"
import ActionBar from "@/components/action-bar"
import DesktopActionBar from "@/components/desktop-action-bar"
import useImageStore from "@/lib/store"

export default function Home() {
  const { imageA, imageB, coverRatio } = useImageStore()
  const [activeTab, setActiveTab] = useState<"preview" | "full">("preview")

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1C1542] to-[#FF2E90]">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="flex flex-col md:flex-row gap-0 md:gap-6 md:p-6">
          {/* 预览区 */}
          <div className="w-full md:w-3/5">
            <PreviewSection activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* 右侧区域 */}
          <div className="hidden md:flex md:w-2/5 md:flex-col gap-4">
            <UploadSection />
            <ParameterSection />
          </div>

          {/* 移动端的上传和参数区 */}
          <div className="md:hidden flex flex-col gap-4 px-4 py-4">
            <UploadSection />
            <ParameterSection />
          </div>
        </div>
      </main>
      {/* 底部操作条 */}
      <ActionBar imageA={imageA} imageB={imageB} coverRatio={coverRatio} />
      {/* 桌面端悬浮操作按钮 */}
      <div className="hidden md:block">
        <DesktopActionBar imageA={imageA} imageB={imageB} coverRatio={coverRatio} />
      </div>
    </div>
  )
}
