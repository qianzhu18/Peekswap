"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Upload } from "lucide-react"
import useImageStore from "@/lib/store"
import { processImage } from "@/lib/image-utils"
import { useToast } from "@/hooks/use-toast"

export default function UploadSection() {
  const { imageA, imageB, setImageA, setImageB } = useImageStore()
  const fileInputA = useRef<HTMLInputElement>(null)
  const fileInputB = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState<"a" | "b" | null>(null)
  const { toast } = useToast()

  const handleFileSelect = async (file: File, type: "a" | "b") => {
    setLoading(type)
    try {
      const data = await processImage(file)
      if (type === "a") {
        setImageA(data)
      } else {
        setImageB(data)
      }
      toast({
        title: "上传成功",
        description: `${data.width} × ${data.height}px`,
      })
    } catch (error) {
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "出错了，网络问题吧",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("bg-white/20")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-white/20")
  }

  const handleDrop = (e: React.DragEvent, type: "a" | "b") => {
    e.preventDefault()
    e.currentTarget.classList.remove("bg-white/20")
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0], type)
    }
  }

  const ImageCard = ({
    title,
    subtitle,
    image,
    type,
    fileInput,
  }: {
    title: string
    subtitle: string
    image: any
    type: "a" | "b"
    fileInput: React.RefObject<HTMLInputElement>
  }) => (
    <Card
      className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl cursor-pointer hover:bg-white/15 transition"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, type)}
      onClick={() => fileInput.current?.click()}
    >
      {image ? (
        <div className="space-y-2">
          <img src={image.url || "/placeholder.svg"} alt={image.name} className="w-full h-32 object-cover rounded-lg" />
          <div className="text-xs text-gray-300 truncate">{image.name}</div>
          <div className="text-xs text-gray-400">
            {image.width} × {image.height}px ({(image.size / 1024 / 1024).toFixed(2)}MB)
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                fileInput.current?.click()
              }}
            >
              替换
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                if (type === "a") setImageA(null)
                else setImageB(null)
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-[#FFE45C]" />
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs text-gray-400">{subtitle}</div>
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0], type)
          }
        }}
      />
    </Card>
  )

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#FFE45C]">整活准备</h2>
      <ImageCard title="先塞隐藏图" subtitle="放在最上面，等他点开才看到" image={imageA} type="a" fileInput={fileInputA} />
      <ImageCard title="再放封面哄他" subtitle="聊天窗口会优先看到它" image={imageB} type="b" fileInput={fileInputB} />
    </div>
  )
}
