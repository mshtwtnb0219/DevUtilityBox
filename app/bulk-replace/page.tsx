"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import PuzzleIcon from "@/components/ui/puzzle-icon" // Declare the PuzzleIcon variable

export default function BulkReplacePage() {
  const [directory, setDirectory] = useState("")
  const [extensions, setExtensions] = useState("*.txt, *.py")
  const [excludeDirs, setExcludeDirs] = useState(".git, node_modules")
  const [searchString, setSearchString] = useState("")
  const [replaceString, setReplaceString] = useState("")
  const [isRegexMode, setIsRegexMode] = useState(false)
  const [removeBOM, setRemoveBOM] = useState(false)
  const [keepBackup, setKeepBackup] = useState(true)
  const [outputExcelLog, setOutputExcelLog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleExecute = () => {
    startTransition(async () => {
      // ここに実際の一括置換ロジックを実装します。
      // 例: ファイルシステムへのアクセス、文字列置換、ログ記録など。
      // 現在はダミーの遅延処理です。
      console.log("一括置換処理を開始します...")
      console.log({
        directory,
        extensions,
        excludeDirs,
        searchString,
        replaceString,
        isRegexMode,
        removeBOM,
        keepBackup,
        outputExcelLog,
      })
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 2秒のダミー処理
      console.log("一括置換処理が完了しました。")
      // 処理結果をUIに反映するロジックを追加
    })
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <PuzzleIcon className="h-7 w-7" />
            一括置換ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            ファイル内の特定の文字列を再帰的に置換します。正規表現にも対応。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* ファイル入力エリア */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📁 ファイル入力エリア</h2>
            <div className="grid gap-2">
              <Label htmlFor="directory">対象ディレクトリ</Label>
              <Input
                id="directory"
                placeholder="例: /path/to/project (ここにファイルをドラッグ＆ドロップ)"
                value={directory}
                onChange={(e) => setDirectory(e.target.value)}
                aria-label="対象ディレクトリ"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                フォルダをドラッグ＆ドロップするか、パスを直接入力してください。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="extensions">対象拡張子</Label>
                <Input
                  id="extensions"
                  placeholder="例: *.txt, *.py, .tf"
                  value={extensions}
                  onChange={(e) => setExtensions(e.target.value)}
                  aria-label="対象拡張子"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">カンマ区切りで指定 (例: *.js, .ts, .json)</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="exclude-dirs">除外ディレクトリ</Label>
                <Input
                  id="exclude-dirs"
                  placeholder="例: .git, node_modules, dist"
                  value={excludeDirs}
                  onChange={(e) => setExcludeDirs(e.target.value)}
                  aria-label="除外ディレクトリ"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">カンマ区切りで指定</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 置換フォーム */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🔍 置換フォーム</h2>
            <div className="grid gap-2">
              <Label htmlFor="search-string">検索文字列</Label>
              <Input
                id="search-string"
                placeholder="検索する文字列または正規表現"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                aria-label="検索文字列"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="replace-string">置換後文字列</Label>
              <Input
                id="replace-string"
                placeholder="置換後の文字列"
                value={replaceString}
                onChange={(e) => setReplaceString(e.target.value)}
                aria-label="置換後文字列"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="regex-mode"
                checked={isRegexMode}
                onCheckedChange={(checked) => setIsRegexMode(!!checked)}
              />
              <Label htmlFor="regex-mode">正規表現モード</Label>
            </div>
          </div>

          <Separator />

          {/* オプション */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🛠 オプション</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="remove-bom" checked={removeBOM} onCheckedChange={(checked) => setRemoveBOM(!!checked)} />
                <Label htmlFor="remove-bom">UTF-8 BOMを削除</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keep-backup"
                  checked={keepBackup}
                  onCheckedChange={(checked) => setKeepBackup(!!checked)}
                />
                <Label htmlFor="keep-backup">バックアップを残す</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="output-excel-log"
                  checked={outputExcelLog}
                  onCheckedChange={(checked) => setOutputExcelLog(!!checked)}
                />
                <Label htmlFor="output-excel-log">結果ログをExcelで出力</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* プレビュー＋ログ */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🖼 プレビュー＋ログ</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 min-h-[150px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              処理前後の差分（ハイライト付き）がここに表示されます。
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 min-h-[100px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              実行ログ（成功 / スキップ / 失敗）がここに表示されます。
            </div>
          </div>

          {/* 実行ボタン */}
          <div className="flex justify-end">
            <Button
              onClick={handleExecute}
              disabled={isPending || !directory || !searchString}
              className="px-8 py-2 text-lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  処理中...
                </>
              ) : (
                "▶ 実行"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
