import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PuzzleIcon, FileTextIcon, NetworkIcon, FolderSyncIcon, GitBranchIcon, CodeIcon } from "lucide-react"

export default function HomePage() {
  const tools = [
    {
      name: "一括置換ツール",
      description: "ファイル内の特定の文字列を再帰的に置換します。正規表現にも対応。",
      href: "/bulk-replace",
      icon: PuzzleIcon,
      category: "基本ツール",
      difficulty: "中",
      status: "実装済み",
      features: ["正規表現対応", "プレビュー機能", "バックアップ作成", "ログ出力"],
    },
    {
      name: "BOM除去／変換ツール",
      description: "複数ファイルの文字コードを整理し、BOMの有無を変換します。",
      href: "/bom-converter",
      icon: FileTextIcon,
      category: "基本ツール",
      difficulty: "低",
      status: "開発中",
      features: ["BOM自動検出", "一括変換", "実行ログ", "ファイル再帰処理"],
    },
    {
      name: "一括リネームツール",
      description: "ファイル名やディレクトリ名を一括で変更し、命名規則を統一します。",
      href: "/batch-rename",
      icon: FolderSyncIcon,
      category: "基本ツール",
      difficulty: "中",
      status: "実装済み",
      features: ["パターン置換", "大文字小文字変換", "接頭辞付与", "プレビュー機能"],
    },
    {
      name: "フォーマット変換ツール",
      description: "YAML、JSON、TOMLの相互変換と整形を行います。構文エラー検出機能付き。",
      href: "/format-converter",
      icon: CodeIcon,
      category: "基本ツール",
      difficulty: "低",
      status: "実装済み",
      features: ["自動フォーマット判定", "構文エラー検出", "整形機能", "コピー・保存機能"],
    },
    {
      name: "Git一括操作ツール",
      description: "複数の個人開発リポジトリを一括で管理・更新します。Pull/Push/Statusを効率的に実行。",
      href: "/git-batch",
      icon: GitBranchIcon,
      category: "開発ツール",
      difficulty: "中",
      status: "実装済み",
      features: ["一括Pull/Push", "ステータス確認", "コミットテンプレート", "リポジトリ管理"],
    },
    {
      name: "CIDR計算ツール",
      description: "IPアドレスとサブネットマスクからネットワーク情報を取得します。",
      href: "/cidr-calculator",
      icon: NetworkIcon,
      category: "ネットワークツール",
      difficulty: "低",
      status: "実装済み",
      features: ["ネットワークアドレス計算", "ホスト数算出", "逆引き範囲", "サブネット分割"],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "実装済み":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "開発中":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "低":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "中":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "高":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const categories = ["基本ツール", "開発ツール", "ネットワークツール"]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Dev Utility Box</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">ITエンジニアのための"面倒くさい"効率化ツール集</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">総ツール数</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tools.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-300">実装済み</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {tools.filter((tool) => tool.status === "実装済み").length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">開発中</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {tools.filter((tool) => tool.status === "開発中").length}
            </p>
          </div>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools
              .filter((tool) => tool.category === category)
              .map((tool) => (
                <Link key={tool.href} href={tool.href} className="group">
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 group-hover:border-blue-300 dark:group-hover:border-blue-600">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <tool.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(tool.status)}>{tool.status}</Badge>
                          <Badge className={getDifficultyColor(tool.difficulty)}>難易度: {tool.difficulty}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-sm">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">主な機能:</h4>
                        <div className="flex flex-wrap gap-1">
                          {tool.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">使い方</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>左側のサイドバーから使用したいツールを選択してください</li>
          <li>各ツールページで必要な設定を行います</li>
          <li>プレビュー機能で結果を確認してから実行してください</li>
          <li>Git一括操作ツールで複数リポジトリを効率的に管理できます</li>
        </ol>
      </div>
    </div>
  )
}
