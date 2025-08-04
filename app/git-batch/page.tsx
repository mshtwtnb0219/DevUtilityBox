"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DownloadIcon } from "lucide-react"

export default function LogDownloadPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <DownloadIcon className="h-7 w-7" />
            操作ログダウンロード
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            実行されたツールの操作ログをCSVまたはExcel形式でダウンロードします。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center">
            このツールは現在開発中です。実行時に記録されたログの一覧、フィルタ（成功 / スキップ / 失敗）、.csv or
            .xlsxでの出力オプションのUIがここに表示されます。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
