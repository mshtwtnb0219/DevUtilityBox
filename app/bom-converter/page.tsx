"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, FileTextIcon, UploadCloud, CheckCircle, XCircle, AlertCircle, FileIcon, FolderIcon } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogManager } from '@/lib/log-manager'

interface FileEntry {
  handle: FileSystemFileHandle
  path: string
  hasBOM: boolean | null
}

interface ProcessResult {
  fileName: string
  filePath: string
  status: "success" | "skipped" | "error"
  message: string
  bomStatusBefore: boolean | null
  bomStatusAfter: boolean | null
}

interface ProcessSummary {
  totalFiles: number
  processedFiles: number
  skippedFiles: number
  errorFiles: number
}

export default function BomConverterPage() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [filesToProcess, setFilesToProcess] = useState<FileEntry[]>([])
  const [bomAction, setBomAction] = useState<"remove" | "add">("remove")
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
      setFilesToProcess([]) // ディレクトリ変更時にファイルをリセット
      setResults([])
      setSummary(null)
    } catch (error) {
      // ユーザーがキャンセルした場合は何もしない（エラーログも出さない）
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      console.error("ディレクトリ選択中にエラーが発生しました:", error)
    }
  }

  // ファイルの再帰的取得とBOM検出
  const getAllFilesAndDetectBOM = async (
    dirHandle: FileSystemDirectoryHandle,
    currentPath = "",
  ): Promise<FileEntry[]> => {
    const files: FileEntry[] = []

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name

        if (handle.kind === "directory") {
          const subFiles = await getAllFilesAndDetectBOM(handle as FileSystemDirectoryHandle, fullPath)
          files.push(...subFiles)
        } else if (handle.kind === "file") {
          // BOM検出はスキャン時に行う
          const { hasBOM } = await detectBOM(handle as FileSystemFileHandle)
          files.push({ handle: handle as FileSystemFileHandle, path: fullPath, hasBOM })
        }
      }
    } catch (error) {
      console.error("ファイル一覧の取得中にエラーが発生しました:", error)
    }

    return files
  }

  // BOM検出ロジック
  const detectBOM = async (fileHandle: FileSystemFileHandle): Promise<{ hasBOM: boolean; content: string }> => {
    const file = await fileHandle.getFile()
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Check for UTF-8 BOM (EF BB BF)
    const hasBOM = uint8Array.length >= 3 && uint8Array[0] === 0xef && uint8Array[1] === 0xbb && uint8Array[2] === 0xbf

    // Decode content (assuming UTF-8 for text files)
    const decoder = new TextDecoder("utf-8")
    const content = decoder.decode(arrayBuffer)

    return { hasBOM, content }
  }

  // ファイル処理（BOMの削除または追加）
  const processFile = async (
    fileEntry: FileEntry,
    action: "remove" | "add",
    preview: boolean,
  ): Promise<ProcessResult> => {
    const { handle, path, hasBOM: bomStatusBefore } = fileEntry
    const fileName = handle.name

    try {
      const { hasBOM: currentHasBOM, content: originalContent } = await detectBOM(handle)

      let newContent = originalContent
      let bomStatusAfter: boolean | null = currentHasBOM
      let message = ""
      let status: ProcessResult["status"] = "skipped"

      if (action === "remove") {
        if (currentHasBOM) {
          newContent = originalContent.startsWith("\ufeff") ? originalContent.substring(1) : originalContent
          bomStatusAfter = false
          message = "BOMを削除しました"
          status = "success"
        } else {
          message = "BOMは元々ありませんでした"
          status = "skipped"
        }
      } else { // action === "add"
        if (!currentHasBOM) {
          newContent = "\ufeff" + originalContent
          bomStatusAfter = true
          message = "BOMを追加しました"
          status = "success"
        } else {
          message = "BOMは元々存在しました"
          status = "skipped"
        }
      }

      if (preview) {
        return {
          fileName,
          filePath: path,
          status: status === "success" ? "success" : "skipped", // In preview, success if a change is planned
          message: status === "success" ? (action === "remove" ? "BOM削除予定" : "BOM追加予定") : message,
          bomStatusBefore: currentHasBOM,
          bomStatusAfter: bomStatusAfter,
        }
      }

      if (status === "success") {
        const writable = await handle.createWritable()
        const encoder = new TextEncoder()
        const encodedContent = encoder.encode(newContent)
        await writable.write(encodedContent)
        await writable.close()
      }

      return {
        fileName,
        filePath: path,
        status,
        message,
        bomStatusBefore: currentHasBOM,
        bomStatusAfter: bomStatusAfter,
      }
    } catch (error) {
      console.error(`ファイル ${fileName} の処理中にエラー:`, error)
      return {
        fileName,
        filePath: path,
        status: "error",
        message: `エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
        bomStatusBefore: bomStatusBefore,
        bomStatusAfter: null,
      }
    }
  }

  // ディレクトリのスキャンとBOM検出
  const handleScan = useCallback(() => {
    if (!directoryHandle) {
      alert("ディレクトリを選択してください")
      return
    }

    setResults([])
    setSummary(null)

    startTransition(async () => {
      const startTime = Date.now()
      try {
        const files = await getAllFilesAndDetectBOM(directoryHandle)
        setFilesToProcess(files)

        const duration = Date.now() - startTime
        const logManager = LogManager.getInstance()
        logManager.addLog({
          toolName: "BOM除去／変換ツール",
          operation: "ファイルスキャン",
          status: "success",
          details: `${files.length}個のファイルをスキャンしました`,
          duration,
          filesProcessed: files.length,
        })
      } catch (error) {
        console.error("スキャン中にエラーが発生しました:", error)
        alert("スキャン中にエラーが発生しました: " + (error instanceof Error ? error.message : "不明なエラー"))
        const duration = Date.now() - startTime
        const logManager = LogManager.getInstance()
        logManager.addLog({
          toolName: "BOM除去／変換ツール",
          operation: "ファイルスキャン",
          status: "error",
          details: "スキャン中にエラーが発生しました",
          duration,
          errorMessage: error instanceof Error ? error.message : "不明なエラー",
        })
      }
    })
  }, [directoryHandle, getAllFilesAndDetectBOM])

  // メイン処理実行
  const handleExecute = useCallback((preview = false) => {
    if (!directoryHandle) {
      alert("ディレクトリを選択してください")
      return
    }
    if (filesToProcess.length === 0) {
      alert("まずファイルをスキャンしてください")
      return
    }

    setPreviewMode(preview)

    startTransition(async () => {
      const startTime = Date.now()
      const logManager = LogManager.getInstance()
      try {
        const processedResults: ProcessResult[] = []
        let processedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const fileEntry of filesToProcess) {
          const result = await processFile(fileEntry, bomAction, preview)
          processedResults.push(result)

          if (result.status === "success") {
            processedCount++
          } else if (result.status === "skipped") {
            skippedCount++
          } else if (result.status === "error") {
            errorCount++
          }
        }

        const currentSummary: ProcessSummary = {
          totalFiles: filesToProcess.length,
          processedFiles: processedCount,
          skippedFiles: skippedCount,
          errorFiles: errorCount,
        }

        setResults(processedResults)
        setSummary(currentSummary)

        const duration = Date.now() - startTime
        logManager.addLog({
          toolName: "BOM除去／変換ツール",
          operation: preview ? "プレビュー実行" : "BOM変換実行",
          status: currentSummary.errorFiles > 0 ? "warning" : "success",
          details: `${currentSummary.totalFiles}個のファイルを処理し、${currentSummary.processedFiles}個のファイルを${preview ? "確認" : "変換"}しました`,
          duration,
          filesProcessed: currentSummary.processedFiles,
        })
      } catch (error) {
        console.error("処理中にエラーが発生しました:", error)
        alert("処理中にエラーが発生しました: " + (error instanceof Error ? error.message : "不明なエラー"))

        const duration = Date.now() - startTime
        logManager.addLog({
          toolName: "BOM除去／変換ツール",
          operation: preview ? "プレビュー実行" : "BOM変換実行",
          status: "error",
          details: "処理中にエラーが発生しました",
          duration,
          errorMessage: error instanceof Error ? error.message : "不明なエラー",
        })
      }
    })
  }, [directoryHandle, filesToProcess, bomAction, processFile])

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

  const getBomStatusBadge = (hasBOM: boolean | null) => {
    if (hasBOM === true) {
      return <Badge variant="destructive">BOMあり</Badge>
    } else if (hasBOM === false) {
      return <Badge variant="secondary">BOMなし</Badge>
    }
    return <Badge variant="outline">不明</Badge>
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
            <FileTextIcon className="h-7 w-7" />
            BOM除去／変換ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            複数ファイルの文字コードを整理し、BOMの有無を変換します。
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

          {/* ディレクトリ選択エリア */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📁 対象ディレクトリ</h2>
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
            <div className="flex justify-center">
              <Button
                onClick={handleScan}
                disabled={isPending || !directoryHandle}
                className="px-8 py-2 text-lg flex items-center gap-2"
              >
                {isPending && !previewMode ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    スキャン中...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-5 w-5" />
                    ファイルをスキャン
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* スキャン結果とBOMアクション選択 */}
          {filesToProcess.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">📄 スキャン結果 ({filesToProcess.length}件)</h2>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                        <th className="px-2 py-1 text-left">ファイル名</th>
                        <th className="px-2 py-1 text-left">パス</th>
                        <th className="px-2 py-1 text-left">BOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filesToProcess.map((file, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-2 py-1 flex items-center gap-1">
                            <FileIcon className="h-4 w-4 text-gray-500" />
                            {file.handle.name}
                          </td>
                          <td className="px-2 py-1 text-gray-600 dark:text-gray-400">{file.path}</td>
                          <td className="px-2 py-1">{getBomStatusBadge(file.hasBOM)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              {/* BOM変換設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">🔧 BOM変換設定</h2>
                <RadioGroup value={bomAction} onValueChange={(value: "remove" | "add") => setBomAction(value)}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remove" id="remove-bom" />
                      <Label htmlFor="remove-bom">BOMを削除</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="add" id="add-bom" />
                      <Label htmlFor="add-bom">BOMを追加</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* 実行ボタン */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => handleExecute(true)}
                  disabled={isPending || filesToProcess.length === 0}
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
                  disabled={isPending || filesToProcess.length === 0}
                  className="px-8 py-2 text-lg"
                >
                  {isPending && !previewMode ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      実行中...
                    </>
                  ) : (
                    "▶ 実行"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* 処理結果 */}
          {summary && (
            <>
              <Separator />
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">{previewMode ? "🖼 プレビュー結果" : "📊 処理結果"}</h2>

                {/* サマリー */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <FileIcon className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <div className="font-medium">{result.fileName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{result.filePath}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getBomStatusBadge(result.bomStatusBefore)}
                          <span>→</span>
                          {getBomStatusBadge(result.bomStatusAfter)}
                        </div>
                        <Badge
                          variant={
                            result.status === "success"
                              ? "default"
                              : result.status === "skipped"
                                ? "secondary"
                                : "destructive"
                          }
                          className="mt-1"
                        >
                          {result.status === "success" ? "成功" : result.status === "skipped" ? "スキップ" : "エラー"}
                        </Badge>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* 使用方法 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">💡 使用方法</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>1. ディレクトリ選択:</strong> 「ディレクトリを選択」ボタンをクリックし、処理対象のフォルダを選びます。
              </p>
              <p>
                <strong>2. ファイルスキャン:</strong> 「ファイルをスキャン」ボタンをクリックすると、選択したディレクトリ内の全ファイルが読み込まれ、BOMの有無が一覧表示されます。
              </p>
              <p>
                <strong>3. BOM変換設定:</strong> 「BOMを削除」または「BOMを追加」のいずれかを選択します。
              </p>
              <p>
                <strong>4. プレビュー/実行:</strong> 「プレビュー」で変更内容を確認し、「実行」で実際にファイルを変換します。
              </p>
              <p>
                <strong>5. 結果確認:</strong> 処理結果のサマリーと詳細ログが表示されます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
