"use client"

import React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MobileCheckWrapperProps {
  children: React.ReactNode
}

export function MobileCheckWrapper({ children }: MobileCheckWrapperProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center bg-gray-100 dark:bg-gray-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">PCで閲覧してください</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              このアプリケーションは、ファイルの読み書きにFile System Access APIを使用しており、現在のところデスクトップブラウザでのみ完全にサポートされています。
              PCでアクセスしてご利用ください。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
