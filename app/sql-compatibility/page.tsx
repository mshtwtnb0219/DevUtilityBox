"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GitBranchIcon,
  FolderIcon,
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  InfoIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  GitCommitIcon,
} from "lucide-react"

interface GitRepository {
  id: string
  name: string
  path: string
  branch: string
  status: "clean" | "modified" | "ahead" | "behind" | "diverged" | "unknown"
  lastChecked: string
  uncommittedChanges: number
  unpushedCommits: number
  unpulledCommits: number
}

interface GitOperation {
  repoId: string
  operation: "pull" | "push" | "status" | "commit"
  status: "pending" | "running" | "success" | "error"
  message: string
  timestamp: string
}

interface CommitTemplate {
  id: string
  name: string
  template: string
  isDefault: boolean
}

export default function GitBatchPage() {
  const [repositories, setRepositories] = useState<GitRepository[]>([])
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [operations, setOperations] = useState<GitOperation[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [newRepoPath, setNewRepoPath] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [commitTemplates, setCommitTemplates] = useState<CommitTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateContent, setNewTemplateContent] = useState("")
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true)
    loadRepositories()
    loadCommitTemplates()
    initializeDefaultTemplates()
  }, [])

  // リポジトリ情報をローカルストレージから読み込み
  const loadRepositories = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("git-batch-repositories")
        if (stored) {
          setRepositories(JSON.parse(stored))
        }
      } catch (error) {
        console.error("リポジトリ情報の読み込みに失敗しました:", error)
      }
    }
  }

  // リポジトリ情報をローカルストレージに保存
  const saveRepositories = (repos: GitRepository[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("git-batch-repositories", JSON.stringify(repos))
      } catch (error) {
        console.error("リポジトリ情報の保存に失敗しました:", error)
      }
    }
  }

  // コミットテンプレートを読み込み
  const loadCommitTemplates = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("git-batch-commit-templates")
        if (stored) {
          setCommitTemplates(JSON.parse(stored))
        }
      } catch (error) {
        console.error("コミットテンプレートの読み込みに失敗しました:", error)
      }
    }
  }

  // コミットテンプレートを保存
  const saveCommitTemplates = (templates: CommitTemplate[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("git-batch-commit-templates", JSON.stringify(templates))
      } catch (error) {
        console.error("コミットテンプレートの保存に失敗しました:", error)
      }
    }
  }

  // デフォルトテンプレートを初期化
  const initializeDefaultTemplates = () => {
    const defaultTemplates: CommitTemplate[] = [
      {
        id: "feat",
        name: "新機能",
        template: "feat: ",
        isDefault: false,
      },
      {
        id: "fix",
        name: "バグ修正",
        template: "fix: ",
        isDefault: false,
      },
      {
        id: "docs",
        name: "ドキュメント",
        template: "docs: ",
        isDefault: false,
      },
      {
        id: "style",
        name: "スタイル",
        template: "style: ",
        isDefault: false,
      },
      {
        id: "refactor",
        name: "リファクタリング",
        template: "refactor: ",
        isDefault: false,
      },
      {
        id: "test",
        name: "テスト",
        template: "test: ",
        isDefault: false,
      },
      {
        id: "chore",
        name: "その他",
        template: "chore: ",
        isDefault: true,
      },
    ]

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("git-batch-commit-templates")
      if (!stored) {
        setCommitTemplates(defaultTemplates)
        saveCommitTemplates(defaultTemplates)
      }
    }
  }

  // リポジトリを追加
  const addRepository = async () => {
    if (!newRepoPath.trim()) {
      alert("リポジトリパスを入力してください")
      return
    }

    // 実際のGit操作はブラウザでは制限されるため、モックデータを生成
    const newRepo: GitRepository = {
      id: `repo-${Date.now()}`,
      name: newRepoPath.split("/").pop() || newRepoPath,
      path: newRepoPath,
      branch: "main",
      status: "unknown",
      lastChecked: new Date().toISOString(),
      uncommittedChanges: 0,
      unpushedCommits: 0,
      unpulledCommits: 0,
    }

    const updatedRepos = [...repositories, newRepo]
    setRepositories(updatedRepos)
    saveRepositories(updatedRepos)
    setNewRepoPath("")

    // 追加後にステータスを確認
    await checkRepositoryStatus(newRepo.id)
  }

  // リポジトリを削除
  const removeRepository = (repoId: string) => {
    if (confirm("このリポジトリを一覧から削除しますか？")) {
      const updatedRepos = repositories.filter((repo) => repo.id !== repoId)
      setRepositories(updatedRepos)
      saveRepositories(updatedRepos)
      setSelectedRepos(new Set([...selectedRepos].filter((id) => id !== repoId)))
    }
  }

  // リポジトリのステータスを確認（モック実装）
  const checkRepositoryStatus = async (repoId: string) => {
    const repo = repositories.find((r) => r.id === repoId)
    if (!repo) return

    // 実際のGit操作の代わりにランダムなステータスを生成
    const statuses: GitRepository["status"][] = ["clean", "modified", "ahead", "behind", "diverged"]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    const updatedRepo: GitRepository = {
      ...repo,
      status: randomStatus,
      lastChecked: new Date().toISOString(),
      uncommittedChanges: randomStatus === "modified" ? Math.floor(Math.random() * 5) + 1 : 0,
      unpushedCommits: randomStatus === "ahead" || randomStatus === "diverged" ? Math.floor(Math.random() * 3) + 1 : 0,
      unpulledCommits: randomStatus === "behind" || randomStatus === "diverged" ? Math.floor(Math.random() * 2) + 1 : 0,
    }

    const updatedRepos = repositories.map((r) => (r.id === repoId ? updatedRepo : r))
    setRepositories(updatedRepos)
    saveRepositories(updatedRepos)
  }

  // 全リポジトリのステータスを確認
  const checkAllStatus = async () => {
    setIsRunning(true)
    const newOperations: GitOperation[] = []

    for (const repo of repositories) {
      newOperations.push({
        repoId: repo.id,
        operation: "status",
        status: "running",
        message: "ステータス確認中...",
        timestamp: new Date().toISOString(),
      })
    }

    setOperations(newOperations)

    // 順次ステータスを確認
    for (let i = 0; i < repositories.length; i++) {
      const repo = repositories[i]
      await new Promise((resolve) => setTimeout(resolve, 500)) // 実行感を演出

      await checkRepositoryStatus(repo.id)

      // 操作結果を更新
      newOperations[i] = {
        ...newOperations[i],
        status: "success",
        message: "ステータス確認完了",
      }
      setOperations([...newOperations])
    }

    setIsRunning(false)
  }

  // Pull操作を実行
  const executePull = async () => {
    if (selectedRepos.size === 0) {
      alert("対象リポジトリを選択してください")
      return
    }

    setIsRunning(true)
    const selectedRepoList = repositories.filter((repo) => selectedRepos.has(repo.id))
    const newOperations: GitOperation[] = []

    for (const repo of selectedRepoList) {
      newOperations.push({
        repoId: repo.id,
        operation: "pull",
        status: "running",
        message: "Pull実行中...",
        timestamp: new Date().toISOString(),
      })
    }

    setOperations(newOperations)

    // 順次Pull実行（モック）
    for (let i = 0; i < selectedRepoList.length; i++) {
      const repo = selectedRepoList[i]
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // ランダムに成功/失敗を決定
      const isSuccess = Math.random() > 0.2 // 80%の確率で成功

      newOperations[i] = {
        ...newOperations[i],
        status: isSuccess ? "success" : "error",
        message: isSuccess ? "Pull完了" : "Pull失敗: リモートリポジトリに接続できません",
      }
      setOperations([...newOperations])

      if (isSuccess) {
        await checkRepositoryStatus(repo.id)
      }
    }

    setIsRunning(false)
  }

  // Push操作を実行
  const executePush = async () => {
    if (selectedRepos.size === 0) {
      alert("対象リポジトリを選択してください")
      return
    }

    setIsRunning(true)
    const selectedRepoList = repositories.filter((repo) => selectedRepos.has(repo.id))
    const newOperations: GitOperation[] = []

    for (const repo of selectedRepoList) {
      newOperations.push({
        repoId: repo.id,
        operation: "push",
        status: "running",
        message: "Push実行中...",
        timestamp: new Date().toISOString(),
      })
    }

    setOperations(newOperations)

    // 順次Push実行（モック）
    for (let i = 0; i < selectedRepoList.length; i++) {
      const repo = selectedRepoList[i]
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const isSuccess = Math.random() > 0.15 // 85%の確率で成功

      newOperations[i] = {
        ...newOperations[i],
        status: isSuccess ? "success" : "error",
        message: isSuccess ? "Push完了" : "Push失敗: 認証エラーまたはコンフリクトが発生しました",
      }
      setOperations([...newOperations])

      if (isSuccess) {
        await checkRepositoryStatus(repo.id)
      }
    }

    setIsRunning(false)
  }

  // コミット操作を実行
  const executeCommit = async () => {
    if (selectedRepos.size === 0) {
      alert("対象リポジトリを選択してください")
      return
    }

    if (!commitMessage.trim()) {
      alert("コミットメッセージを入力してください")
      return
    }

    setIsRunning(true)
    const selectedRepoList = repositories.filter((repo) => selectedRepos.has(repo.id))
    const newOperations: GitOperation[] = []

    for (const repo of selectedRepoList) {
      newOperations.push({
        repoId: repo.id,
        operation: "commit",
        status: "running",
        message: "コミット実行中...",
        timestamp: new Date().toISOString(),
      })
    }

    setOperations(newOperations)

    // 順次コミット実行（モック）
    for (let i = 0; i < selectedRepoList.length; i++) {
      const repo = selectedRepoList[i]
      await new Promise((resolve) => setTimeout(resolve, 800))

      const isSuccess = Math.random() > 0.1 // 90%の確率で成功

      newOperations[i] = {
        ...newOperations[i],
        status: isSuccess ? "success" : "error",
        message: isSuccess
          ? `コミット完了: "${commitMessage}"`
          : "コミット失敗: 変更がないか、ファイルがステージされていません",
      }
      setOperations([...newOperations])

      if (isSuccess) {
        await checkRepositoryStatus(repo.id)
      }
    }

    setIsRunning(false)
    setCommitMessage("")
  }

  // リポジトリ選択の切り替え
  const toggleRepoSelection = (repoId: string) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId)
    } else {
      newSelected.add(repoId)
    }
    setSelectedRepos(newSelected)
  }

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedRepos.size === repositories.length) {
      setSelectedRepos(new Set())
    } else {
      setSelectedRepos(new Set(repositories.map((repo) => repo.id)))
    }
  }

  // コミットテンプレートを適用
  const applyTemplate = (templateId: string) => {
    const template = commitTemplates.find((t) => t.id === templateId)
    if (template) {
      setCommitMessage(template.template)
      setSelectedTemplate(templateId)
    }
  }

  // 新しいテンプレートを追加
  const addCommitTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      alert("テンプレート名と内容を入力してください")
      return
    }

    const newTemplate: CommitTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      template: newTemplateContent,
      isDefault: false,
    }

    const updatedTemplates = [...commitTemplates, newTemplate]
    setCommitTemplates(updatedTemplates)
    saveCommitTemplates(updatedTemplates)
    setNewTemplateName("")
    setNewTemplateContent("")
  }

  // テンプレートを削除
  const removeTemplate = (templateId: string) => {
    if (confirm("このテンプレートを削除しますか？")) {
      const updatedTemplates = commitTemplates.filter((t) => t.id !== templateId)
      setCommitTemplates(updatedTemplates)
      saveCommitTemplates(updatedTemplates)
    }
  }

  // ステータスアイコンを取得
  const getStatusIcon = (status: GitRepository["status"]) => {
    switch (status) {
      case "clean":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "modified":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "ahead":
        return <UploadIcon className="h-4 w-4 text-blue-500" />
      case "behind":
        return <DownloadIcon className="h-4 w-4 text-orange-500" />
      case "diverged":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <InfoIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // ステータスバッジの色を取得
  const getStatusBadgeVariant = (status: GitRepository["status"]) => {
    switch (status) {
      case "clean":
        return "default"
      case "modified":
        return "secondary"
      case "ahead":
      case "behind":
        return "outline"
      case "diverged":
        return "destructive"
      default:
        return "outline"
    }
  }

  // 操作ステータスアイコンを取得
  const getOperationStatusIcon = (status: GitOperation["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <RefreshCwIcon className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // テストデータを生成
  const generateTestData = () => {
    const testRepos: GitRepository[] = [
      {
        id: "test-1",
        name: "my-portfolio",
        path: "/Users/dev/projects/my-portfolio",
        branch: "main",
        status: "clean",
        lastChecked: new Date().toISOString(),
        uncommittedChanges: 0,
        unpushedCommits: 0,
        unpulledCommits: 0,
      },
      {
        id: "test-2",
        name: "todo-app",
        path: "/Users/dev/projects/todo-app",
        branch: "develop",
        status: "modified",
        lastChecked: new Date().toISOString(),
        uncommittedChanges: 3,
        unpushedCommits: 0,
        unpulledCommits: 0,
      },
      {
        id: "test-3",
        name: "blog-system",
        path: "/Users/dev/projects/blog-system",
        branch: "main",
        status: "ahead",
        lastChecked: new Date().toISOString(),
        uncommittedChanges: 0,
        unpushedCommits: 2,
        unpulledCommits: 0,
      },
      {
        id: "test-4",
        name: "api-server",
        path: "/Users/dev/projects/api-server",
        branch: "main",
        status: "behind",
        lastChecked: new Date().toISOString(),
        uncommittedChanges: 0,
        unpushedCommits: 0,
        unpulledCommits: 1,
      },
      {
        id: "test-5",
        name: "mobile-app",
        path: "/Users/dev/projects/mobile-app",
        branch: "feature/auth",
        status: "diverged",
        lastChecked: new Date().toISOString(),
        uncommittedChanges: 1,
        unpushedCommits: 1,
        unpulledCommits: 2,
      },
    ]

    setRepositories(testRepos)
    saveRepositories(testRepos)
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
            <GitBranchIcon className="h-7 w-7" />
            Git一括操作ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            複数の個人開発リポジトリを一括で管理・更新します。Pull/Push/Statusを効率的に実行。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* リポジトリ追加エリア */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              リポジトリ管理
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="リポジトリのパスを入力 (例: /Users/dev/projects/my-app)"
                value={newRepoPath}
                onChange={(e) => setNewRepoPath(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && addRepository()}
              />
              <Button onClick={addRepository} disabled={!newRepoPath.trim()}>
                <PlusIcon className="h-4 w-4 mr-2" />
                追加
              </Button>
              <Button onClick={generateTestData} variant="outline" className="bg-transparent">
                テストデータ生成
              </Button>
            </div>
          </div>

          <Separator />

          {/* リポジトリ一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FolderIcon className="h-5 w-5" />
                リポジトリ一覧 ({repositories.length}件)
              </h2>
              <div className="flex gap-2">
                <Button onClick={checkAllStatus} disabled={isRunning || repositories.length === 0} variant="outline">
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  全ステータス確認
                </Button>
              </div>
            </div>

            {repositories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FolderIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>リポジトリが登録されていません</p>
                <p className="text-sm">上記のフォームからリポジトリを追加してください</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    checked={selectedRepos.size === repositories.length && repositories.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label>全選択 ({selectedRepos.size}件選択中)</Label>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                    >
                      <Checkbox
                        checked={selectedRepos.has(repo.id)}
                        onCheckedChange={() => toggleRepoSelection(repo.id)}
                      />

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(repo.status)}
                            <span className="font-medium">{repo.name}</span>
                            <Badge variant={getStatusBadgeVariant(repo.status)}>{repo.status}</Badge>
                            <Badge variant="outline">{repo.branch}</Badge>
                          </div>
                          <Button
                            onClick={() => removeRepository(repo.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">{repo.path}</p>

                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {repo.uncommittedChanges > 0 && <span>未コミット: {repo.uncommittedChanges}件</span>}
                          {repo.unpushedCommits > 0 && <span>未Push: {repo.unpushedCommits}件</span>}
                          {repo.unpulledCommits > 0 && <span>未Pull: {repo.unpulledCommits}件</span>}
                          <span>最終確認: {new Date(repo.lastChecked).toLocaleString("ja-JP")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* コミットテンプレート */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GitCommitIcon className="h-5 w-5" />
              コミットテンプレート
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">既存テンプレート</h3>
                <div className="grid grid-cols-2 gap-2">
                  {commitTemplates.map((template) => (
                    <div key={template.id} className="flex items-center gap-2">
                      <Button
                        onClick={() => applyTemplate(template.id)}
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        {template.name}
                      </Button>
                      {!template.isDefault && (
                        <Button
                          onClick={() => removeTemplate(template.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">新しいテンプレート</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="テンプレート名"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                  <Input
                    placeholder="テンプレート内容 (例: feat: )"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                  />
                  <Button onClick={addCommitTemplate} disabled={!newTemplateName.trim() || !newTemplateContent.trim()}>
                    テンプレート追加
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 操作エリア */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🚀 一括操作</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Git操作</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={executePull}
                    disabled={isRunning || selectedRepos.size === 0}
                    className="flex-1 bg-transparent"
                    variant="outline"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Pull
                  </Button>
                  <Button
                    onClick={executePush}
                    disabled={isRunning || selectedRepos.size === 0}
                    className="flex-1 bg-transparent"
                    variant="outline"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Push
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">コミット</h3>
                <div className="space-y-2">
                  <Textarea
                    placeholder="コミットメッセージを入力..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={executeCommit}
                    disabled={isRunning || selectedRepos.size === 0 || !commitMessage.trim()}
                    className="w-full"
                  >
                    <GitCommitIcon className="h-4 w-4 mr-2" />
                    コミット実行
                  </Button>
                </div>
              </div>
            </div>

            {selectedRepos.size > 0 && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>{selectedRepos.size}個のリポジトリが選択されています。</AlertDescription>
              </Alert>
            )}
          </div>

          {/* 実行結果 */}
          {operations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">📊 実行結果</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {operations.map((operation, index) => {
                    const repo = repositories.find((r) => r.id === operation.repoId)
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {getOperationStatusIcon(operation.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{repo?.name}</span>
                            <Badge variant="outline">{operation.operation}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{operation.message}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(operation.timestamp).toLocaleTimeString("ja-JP")}
                        </span>
                      </div>
                    )
                  })}
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
                <strong>1. リポジトリ追加:</strong> 管理したいGitリポジトリのパスを入力して追加します
              </p>
              <p>
                <strong>2. ステータス確認:</strong> 「全ステータス確認」で各リポジトリの状態を一括チェックします
              </p>
              <p>
                <strong>3. リポジトリ選択:</strong> 操作対象のリポジトリをチェックボックスで選択します
              </p>
              <p>
                <strong>4. 一括操作:</strong> Pull/Push/コミットを選択したリポジトリに対して一括実行します
              </p>
              <p>
                <strong>5. テンプレート活用:</strong> よく使うコミットメッセージをテンプレートとして保存・利用できます
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
