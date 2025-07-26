"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NetworkIcon } from "lucide-react"

export default function CidrCalculatorPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <NetworkIcon className="h-7 w-7" />
            CIDR計算ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            IPアドレスとサブネットマスクからネットワーク情報を取得します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center">
            このツールは現在開発中です。IPアドレスとマスク長の入力、ネットワークアドレス、ブロードキャストアドレス、ホスト数、範囲、逆引き範囲の表示UIがここに表示されます。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
