"use client"

import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import useImageStore from "@/lib/store"

export default function ParameterSection() {
  const { whiteBarHeight, setWhiteBarHeight } = useImageStore() // 改为 whiteBarHeight

  const getLabel = (value: number) => {
    if (value < 200) return "稳健"
    if (value < 480) return "标准"
    return "爆梗"
  }

  return (
    <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl">
      <h2 className="text-base font-bold text-[#FFE45C] mb-4">彩蛋参数</h2>

      <div className="space-y-4">
        {/* 滑杆 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-300">白色缓冲高度（上下同步）</label>
            <span className="text-sm font-bold text-[#2FF0B5] transition-all duration-150">{whiteBarHeight}px</span>
          </div>

          <Slider
            value={[whiteBarHeight]}
            onValueChange={(value) => setWhiteBarHeight(value[0])}
            min={80}
            max={800}
            step={20}
            className="w-full"
          />

          {/* 刻度标签 */}
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>稳健 (80px)</span>
            <span>标准 (240px)</span>
            <span>爆梗 (800px)</span>
          </div>
        </div>

        {/* 当前模式指示 */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-gray-400">
            当前模式: <span className="text-[#FFE45C] font-bold">{getLabel(whiteBarHeight)}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">上下白底越厚，第二张图越能稳稳待在长图中心，桌面端也更稳。</p>
        </div>

        {/* 提示卡片 */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-bold text-[#FFE45C]">整蛊守则</h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>✓ 只整熟悉的人</li>
            <li>✓ 别越界才好玩</li>
            <li>✓ 截图留个证据</li>
            <li>✓ 记得看朋友反应</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
