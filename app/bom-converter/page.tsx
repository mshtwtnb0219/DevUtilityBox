"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileTextIcon } from "lucide-react"

export default function BomConverterPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <FileTextIcon className="h-7 w-7" />
            BOM除去／変換ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            複数ファイルの文字コードを整理し、BOMの有無を変換します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center">
            このツールは現在開発中です。ファイルの再帰的読み込み、BOM検出、削除/追加オプション、実行ログ表示のUIがここに表示されます。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
