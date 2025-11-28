import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist } from 'next/font/google'
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
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "ud1ska61hr");
          `}
        </Script>
        {children}
        <Toaster richColors position="top-center" closeButton expand={true} />
      </body>
    </html>
  )
}
