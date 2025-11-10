"use client"

import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import useImageStore from "@/lib/store"

export default function ParameterSection() {
  const { coverRatio, setCoverRatio } = useImageStore()

  const getLabel = (value: number) => {
    if (value < 0.32) return "浅尝"
    if (value < 0.43) return "标准"
    return "深埋"
  }

  return (
    <Card className="bg-white/10 backdrop-blur border-white/20 p-4 rounded-xl">
      <h2 className="text-base font-bold text-[#FFE45C] mb-4">彩蛋参数</h2>

      <div className="space-y-4">
        {/* 滑杆 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-300">彩蛋隐蔽度</label>
            <span className="text-sm font-bold text-[#2FF0B5] transition-all duration-150">
              {(coverRatio * 100).toFixed(0)}%
            </span>
          </div>

          <Slider
            value={[coverRatio * 100]}
            onValueChange={(value) => setCoverRatio(value[0] / 100)}
            min={25}
            max={55}
            step={1}
            className="w-full"
          />

          {/* 刻度标签 */}
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>轻描淡写 (25%)</span>
            <span>标准 (40%)</span>
            <span>全力藏匿 (55%)</span>
          </div>
        </div>

        {/* 当前模式指示 */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-gray-400">
            当前模式: <span className="text-[#FFE45C] font-bold">{getLabel(coverRatio)}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">数值越高，底部白边越长，第二张图在聊天预览里更居中。</p>
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
