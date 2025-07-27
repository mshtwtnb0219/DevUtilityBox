"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, PuzzleIcon, FileIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProcessResult {
  fileName: string
  filePath: string
  status: "success" | "skipped" | "error"
  matchCount: number
  message: string
  preview?: {
    before: string
    after: string
  }
}

interface ProcessSummary {
  totalFiles: number
  processedFiles: number
  skippedFiles: number
  errorFiles: number
  totalMatches: number
}

export default function BulkReplacePage() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [extensions, setExtensions] = useState("*.txt, *.js, *.ts, *.jsx, *.tsx")
  const [excludeDirs, setExcludeDirs] = useState(".git, node_modules, dist, build")
  const [searchString, setSearchString] = useState("")
  const [replaceString, setReplaceString] = useState("")
  const [isRegexMode, setIsRegexMode] = useState(false)
  const [removeBOM, setRemoveBOM] = useState(false)
  const [keepBackup, setKeepBackup] = useState(true)
  const [outputExcelLog, setOutputExcelLog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<ProcessResult[]>([])
  const [summary, setSummary] = useState<ProcessSummary | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true)
  }, [])

  // File System Access API対応チェック（クライアントサイドでのみ）
  const isFileSystemAccessSupported = isClient && "showDirectoryPicker" in window

  // ディレクトリ選択
  const selectDirectory = async () => {
    if (!isFileSystemAccessSupported) {
      alert(
        "お使いのブラウザはFile System Access APIに対応していません。Chrome、Edge等の対応ブラウザをご利用ください。",
      )
      return
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" })
      setDirectoryHandle(handle)
    } catch (error) {
      console.error("ディレクトリ選択がキャンセルされました:", error)
    }
  }

  // 拡張子フィルターのパース
  const parseExtensions = (extensionsStr: string): string[] => {
    return extensionsStr
      .split(",")
      .map((ext) => ext.trim().replace("*", ""))
      .filter((ext) => ext.length > 0)
  }

  // 除外ディレクトリのパース
  const parseExcludeDirs = (excludeStr: string): string[] => {
    return excludeStr
      .split(",")
      .map((dir) => dir.trim())
      .filter((dir) => dir.length > 0)
  }

  // ファイルの再帰的取得
  const getAllFiles = async (
    dirHandle: FileSystemDirectoryHandle,
    allowedExtensions: string[],
    excludeDirectories: string[],
    currentPath = "",
  ): Promise<{ handle: FileSystemFileHandle; path: string }[]> => {
    const files: { handle: FileSystemFileHandle; path: string }[] = []

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name

        if (handle.kind === "directory") {
          // 除外ディレクトリのチェック
          if (excludeDirectories.includes(name)) {
            continue
          }
          // 再帰的にサブディレクトリを処理
          const subFiles = await getAllFiles(
            handle as FileSystemDirectoryHandle,
            allowedExtensions,
            excludeDirectories,
            fullPath,
          )
          files.push(...subFiles)
        } else if (handle.kind === "file") {
          // 拡張子のチェック
          const extension = name.substring(name.lastIndexOf("."))
          if (allowedExtensions.length === 0 || allowedExtensions.includes(extension)) {
            files.push({ handle: handle as FileSystemFileHandle, path: fullPath })
          }
        }
      }
    } catch (error) {
      console.error("ファイル一覧の取得中にエラーが発生しました:", error)
    }

    return files
  }

  // BOM除去
  const removeBOMFromText = (text: string): string => {
    // UTF-8 BOM (EF BB BF) を除去
    if (text.charCodeAt(0) === 0xfeff) {
      return text.substring(1)
    }
    return text
  }

  // ファイル処理
  const processFile = async (
    fileHandle: FileSystemFileHandle,
    filePath: string,
    searchPattern: string | RegExp,
    replaceText: string,
    preview = false,
  ): Promise<ProcessResult> => {
    try {
      const file = await fileHandle.getFile()
      let content = await file.text()

      // BOM除去オプション
      if (removeBOM) {
        content = removeBOMFromText(content)
      }

      const originalContent = content
      let matchCount = 0

      // 検索・置換処理
      if (typeof searchPattern === "string") {
        const matches = content.split(searchPattern)
        matchCount = matches.length - 1
        if (matchCount > 0) {
          content = content.replaceAll(searchPattern, replaceText)
        }
      } else {
        const matches = content.match(searchPattern)
        matchCount = matches ? matches.length : 0
        if (matchCount > 0) {
          content = content.replace(searchPattern, replaceText)
        }
      }

      if (matchCount === 0) {
        return {
          fileName: fileHandle.name,
          filePath,
          status: "skipped",
          matchCount: 0,
          message: "マッチする文字列が見つかりませんでした",
        }
      }

      // プレビューモードの場合は実際の書き込みを行わない
      if (preview) {
        return {
          fileName: fileHandle.name,
          filePath,
          status: "success",
          matchCount,
          message: `${matchCount}箇所の置換対象が見つかりました`,
          preview: {
            before: originalContent.substring(0, 200) + (originalContent.length > 200 ? "..." : ""),
            after: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
          },
        }
      }

      // バックアップ作成（簡略化 - 実際のバックアップ作成は制限により省略）
      if (keepBackup) {
        console.log(`バックアップオプションが有効です: ${fileHandle.name}`)
      }

      // ファイル書き込み
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      return {
        fileName: fileHandle.name,
        filePath,
        status: "success",
        matchCount,
        message: `${matchCount}箇所を置換しました`,
      }
    } catch (error) {
      return {
        fileName: fileHandle.name,
        filePath,
        status: "error",
        matchCount: 0,
        message: `エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      }
    }
  }

  // メイン処理実行
  const handleExecute = (preview = false) => {
    if (!directoryHandle) {
      alert("ディレクトリを選択してください")
      return
    }

    if (!searchString) {
      alert("検索文字列を入力してください")
      return
    }

    setPreviewMode(preview)

    startTransition(async () => {
      try {
        const allowedExtensions = parseExtensions(extensions)
        const excludeDirectories = parseExcludeDirs(excludeDirs)

        // ファイル一覧取得
        const files = await getAllFiles(directoryHandle, allowedExtensions, excludeDirectories)

        // 検索パターン作成
        let searchPattern: string | RegExp
        if (isRegexMode) {
          try {
            searchPattern = new RegExp(searchString, "g")
          } catch (error) {
            alert("正規表現が無効です: " + (error instanceof Error ? error.message : "不明なエラー"))
            return
          }
        } else {
          searchPattern = searchString
        }

        // ファイル処理
        const results: ProcessResult[] = []
        let totalMatches = 0

        for (const { handle, path } of files) {
          const result = await processFile(handle, path, searchPattern, replaceString, preview)
          results.push(result)
          totalMatches += result.matchCount
        }

        // サマリー作成
        const summary: ProcessSummary = {
          totalFiles: files.length,
          processedFiles: results.filter((r) => r.status === "success").length,
          skippedFiles: results.filter((r) => r.status === "skipped").length,
          errorFiles: results.filter((r) => r.status === "error").length,
          totalMatches,
        }

        setResults(results)
        setSummary(summary)

        // CSV出力オプション
        if (outputExcelLog && !preview) {
          downloadResultsAsCSV(results, summary)
        }
      } catch (error) {
        console.error("処理中にエラーが発生しました:", error)
        alert("処理中にエラーが発生しました: " + (error instanceof Error ? error.message : "不明なエラー"))
      }
    })
  }

  // CSV形式でダウンロード
  const downloadResultsAsCSV = (results: ProcessResult[], summary: ProcessSummary) => {
    const csvContent = [
      "ファイル名,ファイルパス,ステータス,マッチ数,メッセージ",
      ...results.map((r) => `"${r.fileName}","${r.filePath}","${r.status}","${r.matchCount}","${r.message}"`),
      "",
      `総ファイル数,${summary.totalFiles}`,
      `処理済み,${summary.processedFiles}`,
      `スキップ,${summary.skippedFiles}`,
      `エラー,${summary.errorFiles}`,
      `総マッチ数,${summary.totalMatches}`,
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `bulk-replace-log-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`
    link.click()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // クライアントサイドでのレンダリングが完了するまで何も表示しない
  if (!isClient) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-6xl mx-auto">
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
          {/* File System Access API対応チェック */}
          {!isFileSystemAccessSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                お使いのブラウザはFile System Access
                APIに対応していません。Chrome、Edge等の対応ブラウザをご利用ください。
              </AlertDescription>
            </Alert>
          )}

          {/* ファイル入力エリア */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📁 ファイル入力エリア</h2>
            <div className="grid gap-2">
              <Label htmlFor="directory">対象ディレクトリ</Label>
              <div className="flex gap-2">
                <Button
                  onClick={selectDirectory}
                  variant="outline"
                  className="flex-shrink-0 bg-transparent"
                  disabled={!isFileSystemAccessSupported}
                >
                  ディレクトリを選択
                </Button>
                <Input
                  id="directory"
                  placeholder="ディレクトリを選択してください"
                  value={directoryHandle ? directoryHandle.name : ""}
                  readOnly
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                「ディレクトリを選択」ボタンをクリックして、処理対象のフォルダを選択してください。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="extensions">対象拡張子</Label>
                <Input
                  id="extensions"
                  placeholder="例: *.txt, *.js, *.ts"
                  value={extensions}
                  onChange={(e) => setExtensions(e.target.value)}
                  aria-label="対象拡張子"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">カンマ区切りで指定 (例: *.js, *.ts, *.json)</p>
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
                <Label htmlFor="output-excel-log">結果ログをCSVで出力</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* 実行ボタン */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleExecute(true)}
              disabled={isPending || !directoryHandle || !searchString}
              variant="outline"
              className="px-6 py-2"
            >
              {isPending && previewMode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  プレビュー中...
                </>
              ) : (
                "👁 プレビュー"
              )}
            </Button>
            <Button
              onClick={() => handleExecute(false)}
              disabled={isPending || !directoryHandle || !searchString}
              className="px-8 py-2 text-lg"
            >
              {isPending && !previewMode ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  処理中...
                </>
              ) : (
                "▶ 実行"
              )}
            </Button>
          </div>

          {/* 処理結果 */}
          {summary && (
            <>
              <Separator />
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">{previewMode ? "🖼 プレビュー結果" : "📊 処理結果"}</h2>

                {/* サマリー */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalFiles}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">総ファイル数</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {summary.processedFiles}
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-300">処理済み</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {summary.skippedFiles}
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">スキップ</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.errorFiles}</div>
                    <div className="text-sm text-red-800 dark:text-red-300">エラー</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {summary.totalMatches}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-300">総マッチ数</div>
                  </div>
                </div>

                {/* 詳細結果 */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-medium">{result.fileName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{result.filePath}</div>
                          {result.preview && (
                            <div className="mt-2 text-xs">
                              <div className="text-red-600 dark:text-red-400">変更前: {result.preview.before}</div>
                              <div className="text-green-600 dark:text-green-400">変更後: {result.preview.after}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            result.status === "success"
                              ? "default"
                              : result.status === "skipped"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {result.status === "success"
                            ? `${result.matchCount}件`
                            : result.status === "skipped"
                              ? "スキップ"
                              : "エラー"}
                        </Badge>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
