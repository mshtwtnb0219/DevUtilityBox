"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CopyIcon, DownloadIcon, AlertCircle, CheckCircle, RefreshCwIcon, CodeIcon } from "lucide-react"

type FormatType = "yaml" | "json" | "toml"

interface ConversionError {
  message: string
  line?: number
  column?: number
}

export default function FormatConverterPage() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [inputFormat, setInputFormat] = useState<FormatType | "auto">("auto")
  const [outputFormat, setOutputFormat] = useState<FormatType>("json")
  const [detectedFormat, setDetectedFormat] = useState<FormatType | null>(null)
  const [error, setError] = useState<ConversionError | null>(null)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 簡易YAML パーサー（基本的な構造のみ対応）
  const parseYAML = (yamlString: string): any => {
    const lines = yamlString.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#"))
    const result: any = {}
    let currentObj = result
    const stack: any[] = [result]
    let currentIndent = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const indent = line.length - line.trimStart().length

      // インデントレベルの変更を処理
      if (indent < currentIndent) {
        // インデントが減った場合、スタックを調整
        const levels = Math.floor((currentIndent - indent) / 2)
        for (let i = 0; i < levels; i++) {
          stack.pop()
        }
        currentObj = stack[stack.length - 1]
      }
      currentIndent = indent

      if (trimmed.includes(":")) {
        const [key, ...valueParts] = trimmed.split(":")
        const value = valueParts.join(":").trim()

        if (value === "") {
          // オブジェクトの開始
          currentObj[key.trim()] = {}
          currentObj = currentObj[key.trim()]
          stack.push(currentObj)
        } else if (value.startsWith("[") && value.endsWith("]")) {
          // 配列
          const arrayContent = value.slice(1, -1)
          currentObj[key.trim()] = arrayContent.split(",").map((item) => {
            const trimmedItem = item.trim()
            if (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) {
              return trimmedItem.slice(1, -1)
            }
            if (trimmedItem === "true") return true
            if (trimmedItem === "false") return false
            if (!isNaN(Number(trimmedItem))) return Number(trimmedItem)
            return trimmedItem
          })
        } else {
          // 値の設定
          let parsedValue: any = value
          if (value.startsWith('"') && value.endsWith('"')) {
            parsedValue = value.slice(1, -1)
          } else if (value === "true") {
            parsedValue = true
          } else if (value === "false") {
            parsedValue = false
          } else if (!isNaN(Number(value))) {
            parsedValue = Number(value)
          }
          currentObj[key.trim()] = parsedValue
        }
      } else if (trimmed.startsWith("- ")) {
        // 配列アイテム（簡易実装）
        const value = trimmed.slice(2).trim()
        if (!Array.isArray(currentObj)) {
          // 配列に変換
          const keys = Object.keys(currentObj)
          if (keys.length === 0) {
            Object.setPrototypeOf(currentObj, Array.prototype)
            currentObj.length = 0
          }
        }
      }
    }

    return result
  }

  // YAML文字列生成
  const stringifyYAML = (obj: any, indent = 0): string => {
    const spaces = "  ".repeat(indent)
    let result = ""

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === "object" && item !== null) {
          result += `${spaces}- ${stringifyYAML(item, indent + 1).trim()}\n`
        } else {
          result += `${spaces}- ${typeof item === "string" ? item : JSON.stringify(item)}\n`
        }
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null) {
          result += `${spaces}${key}:\n`
          result += stringifyYAML(value, indent + 1)
        } else {
          const valueStr = typeof value === "string" ? value : JSON.stringify(value)
          result += `${spaces}${key}: ${valueStr}\n`
        }
      }
    }

    return result
  }

  // 簡易TOML パーサー（基本的な構造のみ対応）
  const parseTOML = (tomlString: string): any => {
    const lines = tomlString.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#"))
    const result: any = {}
    let currentSection = result
    let currentSectionName = ""

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        // セクション
        currentSectionName = trimmed.slice(1, -1)
        if (currentSectionName.includes(".")) {
          // ネストしたセクション
          const parts = currentSectionName.split(".")
          let current = result
          for (let i = 0; i < parts.length; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {}
            }
            current = current[parts[i]]
          }
          currentSection = current
        } else {
          if (!result[currentSectionName]) {
            result[currentSectionName] = {}
          }
          currentSection = result[currentSectionName]
        }
      } else if (trimmed.includes("=")) {
        // キー=値のペア
        const [key, ...valueParts] = trimmed.split("=")
        const value = valueParts.join("=").trim()

        let parsedValue: any = value
        if (value.startsWith('"') && value.endsWith('"')) {
          parsedValue = value.slice(1, -1)
        } else if (value.startsWith("[") && value.endsWith("]")) {
          // 配列
          const arrayContent = value.slice(1, -1)
          parsedValue = arrayContent.split(",").map((item) => {
            const trimmedItem = item.trim()
            if (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) {
              return trimmedItem.slice(1, -1)
            }
            if (trimmedItem === "true") return true
            if (trimmedItem === "false") return false
            if (!isNaN(Number(trimmedItem))) return Number(trimmedItem)
            return trimmedItem
          })
        } else if (value === "true") {
          parsedValue = true
        } else if (value === "false") {
          parsedValue = false
        } else if (!isNaN(Number(value))) {
          parsedValue = Number(value)
        }

        currentSection[key.trim()] = parsedValue
      }
    }

    return result
  }

  // TOML文字列生成
  const stringifyTOML = (obj: any): string => {
    let result = ""
    const sections: string[] = []

    // トップレベルのキー・値を処理
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sections.push(key)
      } else {
        const valueStr = Array.isArray(value)
          ? `[${value.map((v) => (typeof v === "string" ? `"${v}"` : JSON.stringify(v))).join(", ")}]`
          : typeof value === "string"
            ? `"${value}"`
            : JSON.stringify(value)
        result += `${key} = ${valueStr}\n`
      }
    }

    if (result && sections.length > 0) {
      result += "\n"
    }

    // セクションを処理
    for (const sectionName of sections) {
      result += `[${sectionName}]\n`
      const section = obj[sectionName]

      for (const [key, value] of Object.entries(section)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // ネストしたセクション
          result += `\n[${sectionName}.${key}]\n`
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            const valueStr = Array.isArray(nestedValue)
              ? `[${nestedValue.map((v) => (typeof v === "string" ? `"${v}"` : JSON.stringify(v))).join(", ")}]`
              : typeof nestedValue === "string"
                ? `"${nestedValue}"`
                : JSON.stringify(nestedValue)
            result += `${nestedKey} = ${valueStr}\n`
          }
        } else {
          const valueStr = Array.isArray(value)
            ? `[${value.map((v) => (typeof v === "string" ? `"${v}"` : JSON.stringify(v))).join(", ")}]`
            : typeof value === "string"
              ? `"${value}"`
              : JSON.stringify(value)
          result += `${key} = ${valueStr}\n`
        }
      }
      result += "\n"
    }

    return result.trim()
  }

  // フォーマット自動判定
  const detectFormat = (text: string): FormatType | null => {
    if (!text.trim()) return null

    try {
      // JSON判定
      JSON.parse(text)
      return "json"
    } catch {}

    // YAML判定（基本的なパターン）
    if (text.includes(":") && !text.includes("=") && !text.includes("[")) {
      return "yaml"
    }

    // TOML判定（基本的なパターン）
    if (text.includes("=") || text.includes("[")) {
      return "toml"
    }

    return null
  }

  // データをパース
  const parseInput = (text: string, format: FormatType): any => {
    switch (format) {
      case "json":
        return JSON.parse(text)
      case "yaml":
        return parseYAML(text)
      case "toml":
        return parseTOML(text)
      default:
        throw new Error("Unsupported format")
    }
  }

  // データを文字列に変換
  const stringifyOutput = (data: any, format: FormatType): string => {
    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2)
      case "yaml":
        return stringifyYAML(data)
      case "toml":
        return stringifyTOML(data)
      default:
        throw new Error("Unsupported format")
    }
  }

  // 変換処理
  const convertFormat = () => {
    if (!inputText.trim()) {
      setOutputText("")
      setError(null)
      setDetectedFormat(null)
      return
    }

    try {
      setError(null)

      // 入力フォーマットの決定
      let actualInputFormat: FormatType
      if (inputFormat === "auto") {
        const detected = detectFormat(inputText)
        if (!detected) {
          throw new Error("フォーマットを自動判定できませんでした。手動で選択してください。")
        }
        actualInputFormat = detected
        setDetectedFormat(detected)
      } else {
        actualInputFormat = inputFormat
        setDetectedFormat(inputFormat)
      }

      // データをパース
      const data = parseInput(inputText, actualInputFormat)

      // 出力フォーマットに変換
      const converted = stringifyOutput(data, outputFormat)
      setOutputText(converted)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "変換エラーが発生しました"
      setError({ message: errorMessage })
      setOutputText("")
    }
  }

  // 入力テキストが変更されたときに自動変換
  useEffect(() => {
    const timer = setTimeout(() => {
      convertFormat()
    }, 500)

    return () => clearTimeout(timer)
  }, [inputText, inputFormat, outputFormat])

  // クリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // 成功フィードバック（簡易実装）
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = "コピー済み!"
        setTimeout(() => {
          button.textContent = originalText
        }, 1000)
      }
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err)
    }
  }

  // ファイルとしてダウンロード
  const downloadFile = (content: string, format: FormatType) => {
    const extensions = { json: "json", yaml: "yml", toml: "toml" }
    const mimeTypes = {
      json: "application/json",
      yaml: "text/yaml",
      toml: "text/plain",
    }

    const blob = new Blob([content], { type: mimeTypes[format] })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `converted.${extensions[format]}`
    link.click()
    URL.revokeObjectURL(url)
  }

  // サンプルデータを読み込み
  const loadSample = (sampleType: string) => {
    const samples = {
      basic: `{
  "name": "MyApp",
  "version": "1.0.0",
  "description": "A sample application",
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  },
  "keywords": ["node", "express", "api"],
  "license": "MIT"
}`,
      config: `server:
  host: localhost
  port: 8080
  ssl:
    enabled: true
    cert_path: "/path/to/cert.pem"
    key_path: "/path/to/key.pem"

database:
  type: postgresql
  host: db.example.com
  port: 5432
  name: myapp_db
  credentials:
    username: dbuser
    password: "secret123"

logging:
  level: info
  format: json
  outputs: ["console", "file"]
  file_path: "/var/log/app.log"

features:
  auth_enabled: true
  rate_limiting: true
  caching: false`,
      infrastructure: `title = "Web Server Configuration"

[server]
host = "0.0.0.0"
port = 3000
workers = 4

[database]
driver = "postgres"
host = "localhost"
port = 5432
name = "production_db"
max_connections = 100

[database.pool]
min_size = 5
max_size = 20
timeout = 30

[redis]
host = "redis.example.com"
port = 6379
db = 0
password = "redis_secret"

[monitoring]
enabled = true
metrics_port = 9090
health_check_path = "/health"

[monitoring.alerts]
cpu_threshold = 80.0
memory_threshold = 85.0
disk_threshold = 90.0`,
    }

    setInputText(samples[sampleType as keyof typeof samples] || "")
  }

  // クライアントサイドでのレンダリングが完了するまで何も表示しない
  if (!isClient) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <CodeIcon className="h-7 w-7" />
            YAML ⇔ JSON ⇔ TOML 変換＋整形ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            IaCや設定ファイルのフォーマット変換を手軽に行います。構文エラーの検出機能付き。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* サンプルデータ読み込み */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📋 サンプルデータ</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => loadSample("basic")}>
                基本的なJSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadSample("config")}>
                設定ファイル（YAML）
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadSample("infrastructure")}>
                インフラ設定（TOML）
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInputText("")}>
                クリア
              </Button>
            </div>
          </div>

          <Separator />

          {/* 変換設定 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📥 入力設定</h2>
              <div className="grid gap-2">
                <Label htmlFor="input-format">入力フォーマット</Label>
                <Select value={inputFormat} onValueChange={(value: any) => setInputFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自動判定</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                    <SelectItem value="toml">TOML</SelectItem>
                  </SelectContent>
                </Select>
                {detectedFormat && inputFormat === "auto" && (
                  <Badge variant="outline" className="w-fit">
                    検出: {detectedFormat.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📤 出力設定</h2>
              <div className="grid gap-2">
                <Label htmlFor="output-format">出力フォーマット</Label>
                <div className="flex gap-2">
                  <Button
                    variant={outputFormat === "json" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOutputFormat("json")}
                  >
                    JSON
                  </Button>
                  <Button
                    variant={outputFormat === "yaml" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOutputFormat("yaml")}
                  >
                    YAML
                  </Button>
                  <Button
                    variant={outputFormat === "toml" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOutputFormat("toml")}
                  >
                    TOML
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 変換エリア */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 入力エリア */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">📝 入力</h2>
                <Button variant="outline" size="sm" onClick={convertFormat}>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  変換
                </Button>
              </div>
              <div className="grid gap-2">
                <Textarea
                  placeholder="YAML、JSON、またはTOMLを入力してください..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </div>

            {/* 出力エリア */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">📄 出力</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(outputText)}
                    disabled={!outputText}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />
                    コピー
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(outputText, outputFormat)}
                    disabled={!outputText}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Textarea
                  value={outputText}
                  readOnly
                  className="min-h-[400px] font-mono text-sm bg-gray-50 dark:bg-gray-800"
                  placeholder="変換結果がここに表示されます..."
                />
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>構文エラー:</strong> {error.message}
                {error.line && error.column && (
                  <span className="block mt-1">
                    行 {error.line}, 列 {error.column}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 成功表示 */}
          {outputText && !error && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                変換が完了しました。{detectedFormat?.toUpperCase()} → {outputFormat.toUpperCase()}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* 使用方法 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">💡 使用方法</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>1. 入力:</strong> 左側のテキストエリアにYAML、JSON、またはTOMLを貼り付けます
              </p>
              <p>
                <strong>2. フォーマット選択:</strong> 入力フォーマットは自動判定されますが、手動選択も可能です
              </p>
              <p>
                <strong>3. 出力選択:</strong> 変換したい形式のボタンをクリックします
              </p>
              <p>
                <strong>4. 結果確認:</strong> 右側に変換結果が表示されます
              </p>
              <p>
                <strong>5. 活用:</strong> コピーボタンでクリップボードに、保存ボタンでファイルダウンロードできます
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
