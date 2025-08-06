import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { MobileCheckWrapper } from '@/components/mobile-check-wrapper'

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
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* MobileCheckWrapperで全体をラップ */}
          <MobileCheckWrapper>
            <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
              <Sidebar />
              <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">{children}</main>
            </div>
          </MobileCheckWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
