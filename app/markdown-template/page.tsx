"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileTextIcon,
  CopyIcon,
  DownloadIcon,
  PlusIcon,
  TrashIcon,
  InfoIcon,
  BookOpenIcon,
  SettingsIcon,
} from "lucide-react"

interface TemplateVariable {
  key: string
  label: string
  defaultValue: string
  type: "text" | "date" | "select"
  options?: string[]
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  variables: TemplateVariable[]
  content: string
}

interface MarkdownSyntax {
  category: string
  syntax: string
  description: string
  example: string
}

export default function MarkdownTemplatePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generatedContent, setGeneratedContent] = useState("")
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [newTemplateContent, setNewTemplateContent] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // ローカルストレージからカスタムテンプレートを読み込み
    const saved = localStorage.getItem("markdown-custom-templates")
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved))
      } catch (error) {
        console.error("カスタムテンプレートの読み込みに失敗しました:", error)
      }
    }
  }, [])

  // カスタムテンプレートをローカルストレージに保存
  const saveCustomTemplates = (templates: Template[]) => {
    localStorage.setItem("markdown-custom-templates", JSON.stringify(templates))
    setCustomTemplates(templates)
  }

  // 定型テンプレート
  const defaultTemplates: Template[] = [
    {
      id: "meeting-minutes",
      name: "議事録",
      description: "会議の議事録テンプレート",
      category: "ビジネス",
      variables: [
        { key: "meeting_title", label: "会議名", defaultValue: "", type: "text" },
        { key: "date", label: "日付", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
        { key: "facilitator", label: "司会者", defaultValue: "", type: "text" },
        { key: "attendees", label: "参加者", defaultValue: "", type: "text" },
      ],
      content: `# {{meeting_title}}

## 会議情報
- **日時**: {{date}}
- **司会者**: {{facilitator}}
- **参加者**: {{attendees}}

## アジェンダ
1. 
2. 
3. 

## 議論内容

### 項目1
- 

### 項目 2
- 

## 決定事項
- 

## アクションアイテム
| 担当者 | タスク | 期限 | ステータス |
|--------|--------|------|------------|
|        |        |      |            |

## 次回会議
- **日時**: 
- **場所**: 
- **アジェンダ**: 
`,
    },
    {
      id: "readme",
      name: "README",
      description: "プロジェクトのREADMEテンプレート",
      category: "開発",
      variables: [
        { key: "project_name", label: "プロジェクト名", defaultValue: "", type: "text" },
        { key: "description", label: "プロジェクト説明", defaultValue: "", type: "text" },
        { key: "author", label: "作成者", defaultValue: "", type: "text" },
        {
          key: "license",
          label: "ライセンス",
          defaultValue: "MIT",
          type: "select",
          options: ["MIT", "Apache 2.0", "GPL v3", "BSD 3-Clause"],
        },
      ],
      content: `# {{project_name}}

{{description}}

## 特徴
- 
- 
- 

## インストール

\`\`\`bash
npm install {{project_name}}
\`\`\`

## 使用方法

\`\`\`javascript
// 基本的な使用例
\`\`\`

## API リファレンス

### メソッド名()
説明

**パラメータ:**
- \`param1\` (string): 説明

**戻り値:**
- 戻り値の説明

## 開発

### 環境構築
\`\`\`bash
git clone https://github.com/username/{{project_name}}.git
cd {{project_name}}
npm install
\`\`\`

### テスト実行
\`\`\`bash
npm test
\`\`\`

## 貢献
プルリクエストを歓迎します。大きな変更を行う場合は、まずissueを開いて変更内容について議論してください。

## ライセンス
[{{license}}](LICENSE)

## 作成者
{{author}}
`,
    },
    {
      id: "retrospective",
      name: "振り返り（KPT）",
      description: "プロジェクト振り返りのKPTテンプレート",
      category: "ビジネス",
      variables: [
        { key: "project_name", label: "プロジェクト名", defaultValue: "", type: "text" },
        { key: "period", label: "対象期間", defaultValue: "", type: "text" },
        { key: "date", label: "実施日", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
        { key: "participants", label: "参加者", defaultValue: "", type: "text" },
      ],
      content: `# {{project_name}} 振り返り

## 基本情報
- **対象期間**: {{period}}
- **実施日**: {{date}}
- **参加者**: {{participants}}

## Keep（良かったこと・続けたいこと）
- 
- 
- 

## Problem（問題・課題）
- 
- 
- 

## Try（次に試したいこと・改善案）
- 
- 
- 

## アクションプラン
| 項目 | 担当者 | 期限 | 優先度 |
|------|--------|------|--------|
|      |        |      |        |

## 次回振り返り予定
- **日時**: 
- **対象期間**: 
`,
    },
    {
      id: "daily-report",
      name: "日報",
      description: "日次業務報告のテンプレート",
      category: "ビジネス",
      variables: [
        { key: "date", label: "日付", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
        { key: "name", label: "報告者", defaultValue: "", type: "text" },
        { key: "weather", label: "天気", defaultValue: "晴れ", type: "select", options: ["晴れ", "曇り", "雨", "雪"] },
      ],
      content: `# 日報 - {{date}}

**報告者**: {{name}}  
**天気**: {{weather}}

## 今日の業務内容
### 完了したタスク
- 
- 
- 

### 進行中のタスク
- 
- 

## 学んだこと・気づき
- 
- 

## 明日の予定
- 
- 
- 

## 課題・相談事項
- 

## その他
- 
`,
    },
    {
      id: "api-spec",
      name: "API仕様書",
      description: "REST API仕様書のテンプレート",
      category: "開発",
      variables: [
        { key: "api_name", label: "API名", defaultValue: "", type: "text" },
        { key: "version", label: "バージョン", defaultValue: "1.0.0", type: "text" },
        { key: "base_url", label: "ベースURL", defaultValue: "https://api.example.com", type: "text" },
      ],
      content: `# {{api_name}} API仕様書

**バージョン**: {{version}}  
**ベースURL**: {{base_url}}

## 概要
{{api_name}}のREST API仕様書です。

## 認証
\`\`\`
Authorization: Bearer <token>
\`\`\`

## エンドポイント一覧

### GET /endpoint
説明

**パラメータ:**
| パラメータ | 型 | 必須 | 説明 |
|------------|----|----- |------|
| param1     | string | ○ | 説明 |

**レスポンス:**
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\`

### POST /endpoint
説明

**リクエストボディ:**
\`\`\`json
{
  "field1": "value1",
  "field2": "value2"
}
\`\`\`

**レスポンス:**
\`\`\`json
{
  "status": "success",
  "message": "Created successfully"
}
\`\`\`

## エラーレスポンス
| ステータスコード | 説明 |
|------------------|------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

## 使用例
\`\`\`bash
curl -X GET "{{base_url}}/endpoint" \\
  -H "Authorization: Bearer <token>"
\`\`\`
`,
    },
  ]

  // Markdown構文一覧
  const markdownSyntaxes: MarkdownSyntax[] = [
    {
      category: "見出し",
      syntax: "# ## ### #### ##### ######",
      description: "見出しレベル1〜6",
      example: "# 大見出し\n## 中見出し\n### 小見出し",
    },
    {
      category: "強調",
      syntax: "**太字** *斜体* ~~取り消し線~~",
      description: "テキストの装飾",
      example: "**重要** *強調* ~~削除~~",
    },
    {
      category: "リスト",
      syntax: "- * + (箇条書き) 1. 2. 3. (番号付き)",
      description: "箇条書きと番号付きリスト",
      example: "- 項目1\n- 項目2\n\n1. 第一項\n2. 第二項",
    },
    {
      category: "リンク",
      syntax: "[表示テキスト](URL)",
      description: "ハイパーリンク",
      example: "[Google](https://google.com)",
    },
    {
      category: "画像",
      syntax: "![代替テキスト](画像URL)",
      description: "画像の埋め込み",
      example: "![ロゴ](logo.png)",
    },
    {
      category: "コード",
      syntax: "`インライン` ```ブロック```",
      description: "コードの表示",
      example: "`console.log()`\n\n```javascript\nfunction hello() {\n  return 'Hello';\n}\n```",
    },
    {
      category: "引用",
      syntax: "> 引用文",
      description: "引用ブロック",
      example: "> これは引用文です。\n> 複数行も可能です。",
    },
    {
      category: "水平線",
      syntax: "--- *** ___",
      description: "区切り線",
      example: "---",
    },
    {
      category: "テーブル",
      syntax: "| 列1 | 列2 |\n|-----|-----|\n| 値1 | 値2 |",
      description: "表の作成",
      example: "| 名前 | 年齢 |\n|------|------|\n| 太郎 | 25   |\n| 花子 | 30   |",
    },
    {
      category: "チェックボックス",
      syntax: "- [ ] 未完了 - [x] 完了",
      description: "タスクリスト",
      example: "- [x] 完了したタスク\n- [ ] 未完了のタスク",
    },
    {
      category: "改行",
      syntax: "行末に2つのスペース または 空行",
      description: "改行の挿入",
      example: "1行目  \n2行目\n\n段落分け",
    },
    {
      category: "エスケープ",
      syntax: "\\文字",
      description: "特殊文字のエスケープ",
      example: "\\*これは強調されません\\*",
    },
  ]

  // 全テンプレート（定型 + カスタム）
  const allTemplates = [...defaultTemplates, ...customTemplates]

  // テンプレート選択時の処理
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = allTemplates.find((t) => t.id === templateId)
    if (template) {
      // 変数の初期値を設定
      const initialVariables: Record<string, string> = {}
      template.variables.forEach((variable) => {
        initialVariables[variable.key] = variable.defaultValue
      })
      setVariables(initialVariables)
      generateContent(template, initialVariables)
    }
  }

  // 変数値変更時の処理
  const handleVariableChange = (key: string, value: string) => {
    const newVariables = { ...variables, [key]: value }
    setVariables(newVariables)

    const template = allTemplates.find((t) => t.id === selectedTemplate)
    if (template) {
      generateContent(template, newVariables)
    }
  }

  // コンテンツ生成
  const generateContent = (template: Template, vars: Record<string, string>) => {
    let content = template.content

    // 変数を置換
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      content = content.replace(regex, value)
    })

    setGeneratedContent(content)
  }

  // カスタムテンプレート追加
  const addCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      alert("テンプレート名と内容を入力してください")
      return
    }

    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription,
      category: "カスタム",
      variables: extractVariables(newTemplateContent),
      content: newTemplateContent,
    }

    const updatedTemplates = [...customTemplates, newTemplate]
    saveCustomTemplates(updatedTemplates)

    // フォームをリセット
    setNewTemplateName("")
    setNewTemplateDescription("")
    setNewTemplateContent("")
  }

  // テンプレートから変数を抽出
  const extractVariables = (content: string): TemplateVariable[] => {
    const matches = content.match(/{{(\w+)}}/g)
    if (!matches) return []

    const uniqueVars = [...new Set(matches.map((match) => match.slice(2, -2)))]
    return uniqueVars.map((varName) => ({
      key: varName,
      label: varName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      defaultValue: "",
      type: "text" as const,
    }))
  }

  // カスタムテンプレート削除
  const deleteCustomTemplate = (templateId: string) => {
    if (confirm("このテンプレートを削除しますか？")) {
      const updatedTemplates = customTemplates.filter((t) => t.id !== templateId)
      saveCustomTemplates(updatedTemplates)

      if (selectedTemplate === templateId) {
        setSelectedTemplate("")
        setGeneratedContent("")
      }
    }
  }

  // クリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
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
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!isClient) {
    return null
  }

  const selectedTemplateData = allTemplates.find((t) => t.id === selectedTemplate)

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <FileTextIcon className="h-7 w-7" />
            Markdownテンプレートジェネレーター
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            議事録・README・振り返りなど、定型構造のMarkdownドキュメントを効率的に作成します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="generator">テンプレート生成</TabsTrigger>
              <TabsTrigger value="custom">カスタム管理</TabsTrigger>
              <TabsTrigger value="syntax">構文一覧</TabsTrigger>
            </TabsList>

            {/* テンプレート生成タブ */}
            <TabsContent value="generator" className="space-y-6">
              {/* テンプレート選択 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  テンプレート選択
                </h2>
                <div className="grid gap-2">
                  <Label htmlFor="template-select">テンプレート</Label>
                  <Select value={selectedTemplate || undefined} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="テンプレートを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </SelectItem>
                      ))}
                      {customTemplates.length > 0 && (
                        <>
                          <Separator />
                          {customTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              [カスタム] {template.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 変数入力 */}
              {selectedTemplateData && selectedTemplateData.variables.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">📝 変数設定</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplateData.variables.map((variable) => (
                        <div key={variable.key} className="grid gap-2">
                          <Label htmlFor={variable.key}>{variable.label}</Label>
                          {variable.type === "select" && variable.options ? (
                            <Select
                              value={variables[variable.key] || variable.defaultValue}
                              onValueChange={(value) => handleVariableChange(variable.key, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {variable.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={variable.key}
                              type={variable.type === "date" ? "date" : "text"}
                              value={variables[variable.key] || variable.defaultValue}
                              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                              placeholder={variable.defaultValue}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 生成結果 */}
              {generatedContent && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">📄 生成結果</h2>
                      <div className="flex gap-2">
                        <Button onClick={() => copyToClipboard(generatedContent)} variant="outline" size="sm">
                          <CopyIcon className="h-4 w-4 mr-2" />
                          コピー
                        </Button>
                        <Button
                          onClick={() => downloadFile(generatedContent, selectedTemplateData?.name || "document")}
                          variant="outline"
                          size="sm"
                        >
                          <DownloadIcon className="h-4 w-4 mr-2" />
                          ダウンロード
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={generatedContent}
                      readOnly
                      className="min-h-[400px] font-mono text-sm bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* カスタムテンプレート管理タブ */}
            <TabsContent value="custom" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  カスタムテンプレート追加
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="template-name">テンプレート名</Label>
                    <Input
                      id="template-name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="例: プロジェクト提案書"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-description">説明</Label>
                    <Input
                      id="template-description"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="例: 新規プロジェクトの提案書テンプレート"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template-content">テンプレート内容</Label>
                  <Textarea
                    id="template-content"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    placeholder="Markdownテンプレートを入力してください。変数は {{変数名}} の形式で記述します。"
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    変数は <code>{"{{変数名}}"}</code> の形式で記述してください。例: <code>{"{{project_name}}"}</code>,{" "}
                    <code>{"{{date}}"}</code>
                  </AlertDescription>
                </Alert>

                <Button onClick={addCustomTemplate} className="w-full">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  カスタムテンプレートを追加
                </Button>
              </div>

              {/* 既存のカスタムテンプレート一覧 */}
              {customTemplates.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">📋 登録済みカスタムテンプレート</h2>
                    <div className="space-y-3">
                      {customTemplates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                            <div className="flex gap-1 mt-2">
                              {template.variables.map((variable) => (
                                <Badge key={variable.key} variant="outline" className="text-xs">
                                  {variable.key}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteCustomTemplate(template.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Markdown構文一覧タブ */}
            <TabsContent value="syntax" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5" />
                  Markdown構文一覧
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                          カテゴリ
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                          構文
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                          説明
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                          例
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {markdownSyntaxes.map((syntax, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">
                            {syntax.category}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {syntax.syntax}
                            </code>
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm">
                            {syntax.description}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap">
                              {syntax.example}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* 使用方法 */}
          <Separator />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">💡 使用方法</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>1. テンプレート選択:</strong> 用途に応じて定型テンプレートを選択します
              </p>
              <p>
                <strong>2. 変数入力:</strong> プロジェクト名や日付などの変数を入力します
              </p>
              <p>
                <strong>3. 生成・活用:</strong> 生成されたMarkdownをコピーまたはダウンロードして使用します
              </p>
              <p>
                <strong>4. カスタム登録:</strong> よく使う独自のテンプレートを登録・管理できます
              </p>
              <p>
                <strong>5. 構文参照:</strong> Markdown構文一覧で記法を確認できます
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
