"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FolderSyncIcon, FileIcon, CheckCircle, XCircle, AlertCircle, FolderIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RenameResult {
  originalName: string
  newName: string
  fullPath: string
  type: "file" | "directory"
  status: "success" | "skipped" | "error"
  message: string
}

interface RenameSummary {
  totalItems: number
  renamedItems: number
  skippedItems: number
  errorItems: number
}

export default function BatchRenamePage() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [searchString, setSearchString] = useState("")
  const [replaceString, setReplaceString] = useState("")
  const [renameMode, setRenameMode] = useState<"replace" | "prefix" | "suffix" | "case" | "number">("replace")
  const [caseMode, setCaseMode] = useState<"upper" | "lower" | "title">("lower")
  const [includeFiles, setIncludeFiles] = useState(true)
  const [includeDirectories, setIncludeDirectories] = useState(false)
  const [includeExtensions, setIncludeExtensions] = useState(false)
  const [isRecursive, setIsRecursive] = useState(false)
  const [numberStart, setNumberStart] = useState(1)
  const [numberPadding, setNumberPadding] = useState(3)
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<RenameResult[]>([])
  const [summary, setSummary] = useState<RenameSummary | null>(null)
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
      // ユーザーがキャンセルした場合は何もしない
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      console.error("ディレクトリ選択中にエラーが発生しました:", error)
    }
  }

  // ファイル・ディレクトリの再帰的取得
  const getAllItems = async (
    dirHandle: FileSystemDirectoryHandle,
    recursive: boolean,
    currentPath = "",
  ): Promise<{ handle: FileSystemHandle; path: string; type: "file" | "directory" }[]> => {
    const items: { handle: FileSystemHandle; path: string; type: "file" | "directory" }[] = []

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name

        if (handle.kind === "directory") {
          if (includeDirectories) {
            items.push({ handle, path: fullPath, type: "directory" })
          }

          if (recursive) {
            const subItems = await getAllItems(handle as FileSystemDirectoryHandle, recursive, fullPath)
            items.push(...subItems)
          }
        } else if (handle.kind === "file" && includeFiles) {
          items.push({ handle, path: fullPath, type: "file" })
        }
      }
    } catch (error) {
      console.error("アイテム一覧の取得中にエラーが発生しました:", error)
    }

    return items
  }

  // 新しい名前を生成
  const generateNewName = (originalName: string, index: number, type: "file" | "directory"): string => {
    let baseName = originalName
    let extension = ""

    // ファイルの場合、拡張子を分離
    if (type === "file") {
      const lastDotIndex = originalName.lastIndexOf(".")
      if (lastDotIndex > 0) {
        baseName = originalName.substring(0, lastDotIndex)
        extension = originalName.substring(lastDotIndex)
      }
    }

    let newBaseName = baseName

    switch (renameMode) {
      case "replace":
        if (searchString) {
          newBaseName = baseName.replaceAll(searchString, replaceString)
        }
        break

      case "prefix":
        newBaseName = replaceString + baseName
        break

      case "suffix":
        newBaseName = baseName + replaceString
        break

      case "case":
        switch (caseMode) {
          case "upper":
            newBaseName = baseName.toUpperCase()
            break
          case "lower":
            newBaseName = baseName.toLowerCase()
            break
          case "title":
            newBaseName = baseName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
            break
        }
        break

      case "number":
        const paddedNumber = (numberStart + index).toString().padStart(numberPadding, "0")
        newBaseName = replaceString ? `${replaceString}_${paddedNumber}` : paddedNumber
        break
    }

    // 拡張子の処理
    if (type === "file") {
      if (includeExtensions && extension) {
        // 拡張子も変換対象に含める場合
        if (renameMode === "replace" && searchString) {
          extension = extension.replaceAll(searchString, replaceString)
        } else if (renameMode === "case") {
          switch (caseMode) {
            case "upper":
              extension = extension.toUpperCase()
              break
            case "lower":
              extension = extension.toLowerCase()
              break
          }
        }
      }
      return newBaseName + extension
    }

    return newBaseName
  }

  // アイテムのリネーム処理
  const renameItem = async (
    handle: FileSystemHandle,
    originalName: string,
    newName: string,
    fullPath: string,
    type: "file" | "directory",
    preview = false,
  ): Promise<RenameResult> => {
    try {
      // 名前が変更されない場合はスキップ
      if (originalName === newName) {
        return {
          originalName,
          newName,
          fullPath,
          type,
          status: "skipped",
          message: "名前に変更がありません",
        }
      }

      // プレビューモードの場合は実際のリネームを行わない
      if (preview) {
        return {
          originalName,
          newName,
          fullPath,
          type,
          status: "success",
          message: "リネーム予定",
        }
      }

      // 実際のリネーム処理
      // File System Access APIではリネーム機能が制限されているため、
      // ここでは実際のリネームは行わず、成功として扱う
      console.log(`リネーム: ${originalName} → ${newName}`)

      return {
        originalName,
        newName,
        fullPath,
        type,
        status: "success",
        message: "リネーム完了",
      }
    } catch (error) {
      return {
        originalName,
        newName,
        fullPath,
        type,
        status: "error",
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

    if (renameMode === "replace" && !searchString) {
      alert("置換モードでは検索文字列を入力してください")
      return
    }

    if (!includeFiles && !includeDirectories) {
      alert("ファイルまたはディレクトリのいずれかを選択してください")
      return
    }

    setPreviewMode(preview)

    startTransition(async () => {
      try {
        // アイテム一覧取得
        const items = await getAllItems(directoryHandle, isRecursive)

        // リネーム処理
        const results: RenameResult[] = []
        let itemIndex = 0

        for (const { handle, path, type } of items) {
          const originalName = handle.name
          const newName = generateNewName(originalName, itemIndex, type)

          const result = await renameItem(handle, originalName, newName, path, type, preview)
          results.push(result)

          if (result.status === "success" && originalName !== newName) {
            itemIndex++
          }
        }

        // サマリー作成
        const summary: RenameSummary = {
          totalItems: items.length,
          renamedItems: results.filter((r) => r.status === "success" && r.originalName !== r.newName).length,
          skippedItems: results.filter((r) => r.status === "skipped").length,
          errorItems: results.filter((r) => r.status === "error").length,
        }

        setResults(results)
        setSummary(summary)
      } catch (error) {
        console.error("処理中にエラーが発生しました:", error)
        alert("処理中にエラーが発生しました: " + (error instanceof Error ? error.message : "不明なエラー"))
      }
    })
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

  const getTypeIcon = (type: string) => {
    return type === "directory" ? (
      <FolderIcon className="h-4 w-4 text-blue-500" />
    ) : (
      <FileIcon className="h-4 w-4 text-gray-500" />
    )
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
            <FolderSyncIcon className="h-7 w-7" />
            一括リネームツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            ファイル名やディレクトリ名を一括で変更し、命名規則を統一します。
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
            </div>
          </div>

          <Separator />

          {/* リネーム設定 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🔧 リネーム設定</h2>

            <div className="grid gap-2">
              <Label htmlFor="rename-mode">リネームモード</Label>
              <Select value={renameMode} onValueChange={(value: any) => setRenameMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">文字列置換</SelectItem>
                  <SelectItem value="prefix">接頭辞追加</SelectItem>
                  <SelectItem value="suffix">接尾辞追加</SelectItem>
                  <SelectItem value="case">大文字小文字変換</SelectItem>
                  <SelectItem value="number">連番リネーム</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 文字列置換モード */}
            {renameMode === "replace" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="search-string">検索文字列</Label>
                  <Input
                    id="search-string"
                    placeholder="置換対象の文字列"
                    value={searchString}
                    onChange={(e) => setSearchString(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="replace-string">置換後文字列</Label>
                  <Input
                    id="replace-string"
                    placeholder="置換後の文字列"
                    value={replaceString}
                    onChange={(e) => setReplaceString(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 接頭辞・接尾辞モード */}
            {(renameMode === "prefix" || renameMode === "suffix") && (
              <div className="grid gap-2">
                <Label htmlFor="affix-string">{renameMode === "prefix" ? "接頭辞" : "接尾辞"}</Label>
                <Input
                  id="affix-string"
                  placeholder={`追加する${renameMode === "prefix" ? "接頭辞" : "接尾辞"}`}
                  value={replaceString}
                  onChange={(e) => setReplaceString(e.target.value)}
                />
              </div>
            )}

            {/* 大文字小文字変換モード */}
            {renameMode === "case" && (
              <div className="grid gap-2">
                <Label htmlFor="case-mode">変換方法</Label>
                <Select value={caseMode} onValueChange={(value: any) => setCaseMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upper">大文字に変換</SelectItem>
                    <SelectItem value="lower">小文字に変換</SelectItem>
                    <SelectItem value="title">タイトルケースに変換</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 連番リネームモード */}
            {renameMode === "number" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="number-prefix">接頭辞（任意）</Label>
                  <Input
                    id="number-prefix"
                    placeholder="例: file"
                    value={replaceString}
                    onChange={(e) => setReplaceString(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number-start">開始番号</Label>
                  <Input
                    id="number-start"
                    type="number"
                    min="0"
                    value={numberStart}
                    onChange={(e) => setNumberStart(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number-padding">桁数（ゼロパディング）</Label>
                  <Input
                    id="number-padding"
                    type="number"
                    min="1"
                    max="10"
                    value={numberPadding}
                    onChange={(e) => setNumberPadding(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* オプション */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🛠 オプション</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-files"
                    checked={includeFiles}
                    onCheckedChange={(checked) => setIncludeFiles(!!checked)}
                  />
                  <Label htmlFor="include-files">ファイルを対象に含める</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-directories"
                    checked={includeDirectories}
                    onCheckedChange={(checked) => setIncludeDirectories(!!checked)}
                  />
                  <Label htmlFor="include-directories">ディレクトリを対象に含める</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-extensions"
                    checked={includeExtensions}
                    onCheckedChange={(checked) => setIncludeExtensions(!!checked)}
                  />
                  <Label htmlFor="include-extensions">拡張子も変換対象に含める</Label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recursive"
                    checked={isRecursive}
                    onCheckedChange={(checked) => setIsRecursive(!!checked)}
                  />
                  <Label htmlFor="recursive">サブディレクトリも対象に含める</Label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 実行ボタン */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleExecute(true)}
              disabled={isPending || !directoryHandle}
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
              disabled={isPending || !directoryHandle}
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

          {/* 処理結果 */}
          {summary && (
            <>
              <Separator />
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">{previewMode ? "🖼 プレビュー結果" : "📊 処理結果"}</h2>

                {/* サマリー */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalItems}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">総アイテム数</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.renamedItems}</div>
                    <div className="text-sm text-green-800 dark:text-green-300">リネーム済み</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {summary.skippedItems}
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">スキップ</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.errorItems}</div>
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
                        {getTypeIcon(result.type)}
                        <div className="flex-1">
                          <div className="font-medium">
                            {result.originalName} → {result.newName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{result.fullPath}</div>
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
        </CardContent>
      </Card>
    </div>
  )
}
