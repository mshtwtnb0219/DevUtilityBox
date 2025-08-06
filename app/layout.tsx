import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dev Utility Box",
  description: "ITエンジニアのための“面倒くさい”効率化ツール集",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <html lang="ja" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex items-center justify-center min-h-screen p-4 text-center bg-gray-100 dark:bg-gray-950">
              <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">PCで閲覧してください</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  このアプリケーションは、ファイルの読み書きにFile System Access APIを使用しており、現在のところデスクトップブラウザでのみ完全にサポートされています。
                  PCでアクセスしてご利用ください。
                </p>
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    )
  }

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
            <Sidebar />
            <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
