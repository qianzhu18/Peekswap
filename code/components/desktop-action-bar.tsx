"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Zap, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { composeImages } from "@/lib/image-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DesktopActionBarProps {
  imageA: any
  imageB: any
  whiteBarHeight: number // 改为 whiteBarHeight
}

export default function DesktopActionBar({ imageA, imageB, whiteBarHeight }: DesktopActionBarProps) {
  const [isComposing, setIsComposing] = useState(false)
  const [showComposedImage, setShowComposedImage] = useState(false)
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null)
  const [composedUrl, setComposedUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCompose = async () => {
    if (!imageA || !imageB) {
      toast({
        title: "等等，图片呢？",
        description: "先把两张图都上传了再说",
        variant: "destructive",
      })
      return
    }

    setIsComposing(true)
    try {
      const blob = await composeImages(imageA, imageB, whiteBarHeight) // 传递像素值
      const url = URL.createObjectURL(blob)

      setComposedBlob(blob)
      setComposedUrl(url)
      setShowComposedImage(true)

      toast({
        title: "彩蛋装填完毕！",
        description: "发出去，看他们表情！",
      })
    } catch (error) {
      toast({
        title: "合成失败",
        description: error instanceof Error ? error.message : "出错了",
        variant: "destructive",
      })
    } finally {
      setIsComposing(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleExport = () => {
    if (!composedUrl) {
      toast({
        title: "还没合成呢",
        description: '先点"上线整活"生成长图吧',
      })
      return
    }

    const link = document.createElement("a")
    link.href = composedUrl
    link.download = `peekswap-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "下载开始",
      description: "记得截图留个证据！",
    })
  }

  const copyText = () => {
    const text = "别怂，去炸群！"
    navigator.clipboard.writeText(text)
    toast({
      title: "文案已复制",
      description: text,
    })
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
        <Button
          size="lg"
          variant="outline"
          className="rounded-full w-14 h-14 p-0 bg-transparent"
          onClick={handleRefresh}
          title="刷新槽点"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          className="rounded-full w-14 h-14 p-0 bg-[#FFE45C] text-[#1C1542] hover:bg-[#FFE45C]/90"
          onClick={handleCompose}
          disabled={isComposing || !imageA || !imageB}
          title="上线整活"
        >
          <Zap className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-full w-14 h-14 p-0 bg-transparent"
          onClick={handleExport}
          title="拷走彩蛋"
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>

      {/* 合成成功对话框 */}
      <Dialog open={showComposedImage} onOpenChange={setShowComposedImage}>
        <DialogContent className="bg-gray-900 border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFE45C]">整蛊成功卡</DialogTitle>
          </DialogHeader>
          {composedUrl && (
            <div className="space-y-4">
              <img
                src={composedUrl || "/placeholder.svg"}
                alt="Composed"
                className="w-full rounded-lg max-h-96 object-cover"
              />
              <div className="space-y-2 text-sm text-gray-300">
                <p>文件大小: {composedBlob ? (composedBlob.size / 1024).toFixed(1) : "0"}KB</p>
                <p className="text-xs text-gray-400">长按保存或右键下载</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#2FF0B5] text-[#1C1542] hover:bg-[#2FF0B5]/90 font-bold"
                  onClick={copyText}
                >
                  复制推荐文案
                </Button>
                <Button
                  className="flex-1 bg-[#FFE45C] text-[#1C1542] hover:bg-[#FFE45C]/90 font-bold"
                  onClick={handleExport}
                >
                  下载长图
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
