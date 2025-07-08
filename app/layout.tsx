import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: '学校時間割管理システム',
  description: '中学・高等学校向け時間割生成・管理Webアプリケーション',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
