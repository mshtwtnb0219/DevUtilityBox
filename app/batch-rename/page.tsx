"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FolderSyncIcon } from "lucide-react"

export default function BatchRenamePage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <FolderSyncIcon className="h-7 w-7" />
            一括リネームツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            ファイル名やディレクトリ名を一括で変更し、命名規則を統一します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center">
            このツールは現在開発中です。対象パス指定、名前の一括置換（大文字⇔小文字、接頭辞付与など）、プレビューと実行ログのUIがここに表示されます。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
