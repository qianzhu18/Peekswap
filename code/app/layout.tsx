import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PeekSwap Lite · 搞事模式",
  description: "上传两张图，一键拼出聊天封面彩蛋。移动端优先，纯前端本地合成。",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.className} antialiased`}>
        {children}
        <Analytics />
        <Toaster richColors position="top-center" closeButton expand={true} />
      </body>
    </html>
  )
}
