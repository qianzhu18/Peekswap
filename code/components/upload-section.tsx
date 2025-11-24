"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Upload } from "lucide-react"
import useImageStore from "@/lib/store"
import { normalizeToNineSixteen, processImage, type ProcessedImage } from "@/lib/image-utils"
import { useToast } from "@/hooks/use-toast"

export default function UploadSection() {
  const { imageA, imageB, setImageA, setImageB } = useImageStore()
  const fileInputA = useRef<HTMLInputElement>(null)
  const fileInputB = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState<"a" | "b" | null>(null)
  const [fixing, setFixing] = useState<"a" | "b" | null>(null)
  const { toast } = useToast()
  const targetAspect = 9 / 16

  const enforceNineSixteen = async (data: ProcessedImage, type: "a" | "b") => {
    const ratio = data.width / data.height
    if (Math.abs(ratio - targetAspect) <= 0.01) {
      return data
    }
    const normalized = await normalizeToNineSixteen(data)
    toast({
      title: "已自动裁成 9:16",
      description: `${normalized.width} × ${normalized.height}px`,
    })
    return normalized
  }

  const handleFileSelect = async (file: File, type: "a" | "b") => {
    setLoading(type)
    try {
      let data = await processImage(file)
      data = await enforceNineSixteen(data, type)
      if (type === "a") setImageA(data)
      else setImageB(data)
      toast({ title: "上传成功", description: `${data.width} × ${data.height}px` })
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

  const getAspectInfo = (image: ProcessedImage | null) => {
    if (!image) {
      return { ratioText: "等待上传", status: "pending", ratioValue: null as number | null }
    }
    const ratioValue = image.width / image.height
    const diff = Math.abs(ratioValue - targetAspect)
    const ratioText = ratioValue.toFixed(3)
    if (diff <= 0.01) {
      return { ratioText, status: "ok", ratioValue }
    }
    return { ratioText, status: ratioValue > targetAspect ? "wide" : "tall", ratioValue }
  }

  const handleNormalize = async (type: "a" | "b") => {
    const current = type === "a" ? imageA : imageB
    if (!current) return
    setFixing(type)
    try {
      const normalized = await enforceNineSixteen(current, type)
      if (type === "a") {
        setImageA(normalized)
      } else {
        setImageB(normalized)
      }
      toast({
        title: "已转成 9:16",
        description: `${normalized.width} × ${normalized.height}px`,
      })
    } catch (error) {
      toast({
        title: "处理失败",
        description: error instanceof Error ? error.message : "转成 9:16 出错了",
        variant: "destructive",
      })
    } finally {
      setFixing(null)
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
      <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#FFE45C]">9:16 比例提醒</p>
            <p className="text-xs text-gray-300">效果最佳的上传比例是 9:16，可一键修正</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-[#2FF0B5]">建议</span>
        </div>
        <div className="space-y-2">
          {([
            { label: "隐藏图 A", image: imageA, type: "a" as const },
            { label: "封面图 B", image: imageB, type: "b" as const },
          ]).map(({ label, image, type }) => {
            const info = getAspectInfo(image)
            const needFix = !!info.ratioValue && info.status !== "ok"
            return (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 border border-white/10"
              >
                <div className="space-y-0.5">
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-gray-400">
                    {info.ratioText} {info.status === "ok" ? "· 已是 9:16" : info.status === "pending" ? "" : "· 需调整"}
                  </p>
                </div>
                {needFix ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleNormalize(type)}
                    disabled={fixing === type || loading !== null}
                  >
                    {fixing === type ? "处理中..." : "转成 9:16"}
                  </Button>
                ) : (
                  <span className="text-xs text-[#2FF0B5]">{info.status === "ok" ? "OK" : "等待上传"}</span>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-gray-400">
          提示：如果原图比例不符，会导致预览偏移或白边过大。点击「转成 9:16」即可在站内裁切到合适比例。
        </p>
      </Card>
    </div>
  )
}
