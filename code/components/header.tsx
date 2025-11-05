"use client"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* 左侧品牌信息 */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg md:text-xl font-bold text-[#FFE45C] drop-shadow-lg">PeekSwap Lite</h1>
          <p className="text-xs md:text-sm text-[#2FF0B5] font-medium">点开有惊、截屏有梗</p>
        </div>

        {/* 右侧按钮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#FFE45C] hover:bg-white/10 hover:text-[#FFE45C] md:text-base"
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
              <span className="ml-2 hidden sm:inline">玩家须知</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur">
            <div className="p-3 space-y-3">
              <div className="text-sm">
                <h3 className="font-bold text-[#1C1542] mb-2">整蛊守则</h3>
                <ul className="text-xs text-gray-700 space-y-1.5">
                  <li>✓ 只整熟悉的人</li>
                  <li>✓ 别越界才好玩</li>
                  <li>✓ 记得看朋友反应</li>
                  <li>✓ 截图留个证据</li>
                </ul>
              </div>
              <div className="text-sm border-t pt-2">
                <h3 className="font-bold text-[#1C1542] mb-2">使用提醒</h3>
                <p className="text-xs text-gray-700">
                  所有图片处理均在浏览器本地完成，我们不保存任何数据。尽情创意，不用担心隐私问题。
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
