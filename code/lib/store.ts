"use client"

import { create } from "zustand"

interface ImageData {
  url: string
  name: string
  width: number
  height: number
  size: number
}

interface ImageStore {
  imageA: ImageData | null
  imageB: ImageData | null
  coverRatio: number // 封面区域占整张图高度的比例（0-1）
  setImageA: (data: ImageData | null) => void
  setImageB: (data: ImageData | null) => void
  setCoverRatio: (ratio: number) => void
}

const useImageStore = create<ImageStore>((set) => ({
  imageA: null,
  imageB: null,
  coverRatio: 0.4,
  setImageA: (data) => set({ imageA: data }),
  setImageB: (data) => set({ imageB: data }),
  setCoverRatio: (ratio) => set({ coverRatio: ratio }),
}))

if (typeof window !== "undefined") {
  ;(window as any).__PEEKSWAP_STORE__ = useImageStore
}

export default useImageStore
