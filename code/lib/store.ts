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
  whiteBarHeight: number // 改为 whiteBarHeight，单位为像素（px）
  setImageA: (data: ImageData | null) => void
  setImageB: (data: ImageData | null) => void
  setWhiteBarHeight: (height: number) => void // 重命名 setter
}

const useImageStore = create<ImageStore>((set) => ({
  imageA: null,
  imageB: null,
  whiteBarHeight: 240, // 默认值提升，保证预览遮挡更充足
  setImageA: (data) => set({ imageA: data }),
  setImageB: (data) => set({ imageB: data }),
  setWhiteBarHeight: (height) => set({ whiteBarHeight: height }),
}))

export default useImageStore
