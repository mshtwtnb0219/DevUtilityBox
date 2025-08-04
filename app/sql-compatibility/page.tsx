"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatabaseIcon, SearchIcon } from "lucide-react"

interface SQLFunction {
  id: string
  category: string
  functionName: string
  description: string
  oracle: string
  postgresql: string
  mysql: string
  notes: string
}

interface SQLSyntax {
  id: string
  category: string
  feature: string
  description: string
  oracle: string
  postgresql: string
  mysql: string
  notes: string
}

export default function SQLCompatibilityPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // SQL関数データ
  const sqlFunctions: SQLFunction[] = [
    {
      id: "concat",
      category: "文字列関数",
      functionName: "CONCAT（文字列連結）",
      description: "文字列を連結する",
      oracle: "string1 || string2",
      postgresql: "string1 || string2 または CONCAT(string1, string2)",
      mysql: "CONCAT(string1, string2)",
      notes: "MySQLでは||演算子は使用不可（OR演算子として解釈される）",
    },
    {
      id: "substring",
      category: "文字列関数",
      functionName: "SUBSTRING（部分文字列）",
      description: "文字列の一部を抽出する",
      oracle: "SUBSTR(string, start, length)",
      postgresql: "SUBSTRING(string FROM start FOR length)",
      mysql: "SUBSTRING(string, start, length)",
      notes: "構文が各DBで異なる。PostgreSQLはFROM...FOR構文が標準",
    },
    {
      id: "length",
      category: "文字列関数",
      functionName: "LENGTH（文字列長）",
      description: "文字列の長さを取得する",
      oracle: "LENGTH(string)",
      postgresql: "LENGTH(string) または CHAR_LENGTH(string)",
      mysql: "LENGTH(string) または CHAR_LENGTH(string)",
      notes: "マルチバイト文字の場合、LENGTHはバイト数、CHAR_LENGTHは文字数を返す",
    },
    {
      id: "upper",
      category: "文字列関数",
      functionName: "UPPER（大文字変換）",
      description: "文字列を大文字に変換する",
      oracle: "UPPER(string)",
      postgresql: "UPPER(string)",
      mysql: "UPPER(string)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "lower",
      category: "文字列関数",
      functionName: "LOWER（小文字変換）",
      description: "文字列を小文字に変換する",
      oracle: "LOWER(string)",
      postgresql: "LOWER(string)",
      mysql: "LOWER(string)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "trim",
      category: "文字列関数",
      functionName: "TRIM（空白除去）",
      description: "文字列の前後の空白を除去する",
      oracle: "TRIM(string)",
      postgresql: "TRIM(string)",
      mysql: "TRIM(string)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "now",
      category: "日付関数",
      functionName: "現在日時取得",
      description: "現在の日時を取得する",
      oracle: "SYSDATE",
      postgresql: "NOW()",
      mysql: "NOW()",
      notes: "Oracleでは主にSYSDATE、他DBではNOW()を使用",
    },
    {
      id: "dateformat",
      category: "日付関数",
      functionName: "日付フォーマット",
      description: "日付を指定した形式で表示する",
      oracle: "TO_CHAR(date, 'YYYY-MM-DD')",
      postgresql: "TO_CHAR(date, 'YYYY-MM-DD')",
      mysql: "DATE_FORMAT(date, '%Y-%m-%d')",
      notes: "MySQLではDATE_FORMAT関数を使用し、フォーマット文字列も異なる",
    },
    {
      id: "dateadd",
      category: "日付関数",
      functionName: "日付加算",
      description: "日付に指定した期間を加算する",
      oracle: "date + INTERVAL '1' DAY",
      postgresql: "date + INTERVAL '1 day'",
      mysql: "DATE_ADD(date, INTERVAL 1 DAY)",
      notes: "MySQLではDATE_ADD関数、他DBではINTERVAL演算子を使用",
    },
    {
      id: "coalesce",
      category: "NULL処理関数",
      functionName: "COALESCE（NULL処理）",
      description: "最初のNULLでない値を返す",
      oracle: "COALESCE(value1, value2) または NVL(value1, value2)",
      postgresql: "COALESCE(value1, value2)",
      mysql: "COALESCE(value1, value2) または IFNULL(value1, value2)",
      notes: "全DBでCOALESCEが使用可能。OracleはNVL、MySQLはIFNULLも利用可能",
    },
    {
      id: "round",
      category: "数値関数",
      functionName: "ROUND（四捨五入）",
      description: "数値を指定した桁数で四捨五入する",
      oracle: "ROUND(number, digits)",
      postgresql: "ROUND(number, digits)",
      mysql: "ROUND(number, digits)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "ceil",
      category: "数値関数",
      functionName: "CEIL（切り上げ）",
      description: "数値を切り上げる",
      oracle: "CEIL(number)",
      postgresql: "CEIL(number) または CEILING(number)",
      mysql: "CEIL(number) または CEILING(number)",
      notes: "全DBでCEILが使用可能。PostgreSQLとMySQLはCEILINGも利用可能",
    },
    {
      id: "floor",
      category: "数値関数",
      functionName: "FLOOR（切り下げ）",
      description: "数値を切り下げる",
      oracle: "FLOOR(number)",
      postgresql: "FLOOR(number)",
      mysql: "FLOOR(number)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "abs",
      category: "数値関数",
      functionName: "ABS（絶対値）",
      description: "数値の絶対値を取得する",
      oracle: "ABS(number)",
      postgresql: "ABS(number)",
      mysql: "ABS(number)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "count",
      category: "集約関数",
      functionName: "COUNT（件数）",
      description: "行数をカウントする",
      oracle: "COUNT(*) または COUNT(column)",
      postgresql: "COUNT(*) または COUNT(column)",
      mysql: "COUNT(*) または COUNT(column)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "sum",
      category: "集約関数",
      functionName: "SUM（合計）",
      description: "数値の合計を計算する",
      oracle: "SUM(column)",
      postgresql: "SUM(column)",
      mysql: "SUM(column)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "avg",
      category: "集約関数",
      functionName: "AVG（平均）",
      description: "数値の平均を計算する",
      oracle: "AVG(column)",
      postgresql: "AVG(column)",
      mysql: "AVG(column)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "max",
      category: "集約関数",
      functionName: "MAX（最大値）",
      description: "最大値を取得する",
      oracle: "MAX(column)",
      postgresql: "MAX(column)",
      mysql: "MAX(column)",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "min",
      category: "集約関数",
      functionName: "MIN（最小値）",
      description: "最小値を取得する",
      oracle: "MIN(column)",
      postgresql: "MIN(column)",
      mysql: "MIN(column)",
      notes: "全DBで同じ構文で使用可能",
    },
  ]

  // SQL構文データ
  const sqlSyntaxes: SQLSyntax[] = [
    {
      id: "limit",
      category: "結果制限",
      feature: "LIMIT句（結果制限）",
      description: "取得する行数を制限する",
      oracle: "WHERE ROWNUM <= 10 または FETCH FIRST 10 ROWS ONLY（12c以降）",
      postgresql: "LIMIT 10 OFFSET 5",
      mysql: "LIMIT 10 OFFSET 5",
      notes: "OracleではROWNUMまたはFETCH FIRST、他DBではLIMITを使用",
    },
    {
      id: "autoincrement",
      category: "データ型",
      feature: "自動増分（AUTO INCREMENT）",
      description: "自動的に増分される主キー",
      oracle: "SEQUENCE + TRIGGER または IDENTITY列（12c以降）",
      postgresql: "SERIAL または IDENTITY",
      mysql: "AUTO_INCREMENT",
      notes: "各DBで異なる実装方法。PostgreSQLのSERIALが最もシンプル",
    },
    {
      id: "boolean",
      category: "データ型",
      feature: "真偽値型（BOOLEAN）",
      description: "真偽値を格納するデータ型",
      oracle: "NUMBER(1) CHECK制約 または CHAR(1)",
      postgresql: "BOOLEAN",
      mysql: "BOOLEAN（TINYINT(1)のエイリアス）",
      notes: "Oracleにはネイティブなブール型が存在しない",
    },
    {
      id: "varchar",
      category: "データ型",
      feature: "可変長文字列（VARCHAR）",
      description: "可変長の文字列データ型",
      oracle: "VARCHAR2(size)",
      postgresql: "VARCHAR(size) または TEXT",
      mysql: "VARCHAR(size)",
      notes: "OracleではVARCHAR2を推奨。PostgreSQLはTEXT型も利用可能",
    },
    {
      id: "case",
      category: "条件分岐",
      feature: "CASE式（条件分岐）",
      description: "条件に応じて値を返す",
      oracle: "CASE WHEN condition THEN value ELSE value END",
      postgresql: "CASE WHEN condition THEN value ELSE value END",
      mysql: "CASE WHEN condition THEN value ELSE value END",
      notes: "全DBで同じ構文で使用可能",
    },
    {
      id: "join",
      category: "結合",
      feature: "JOIN構文（テーブル結合）",
      description: "テーブルを結合する",
      oracle: "INNER/LEFT/RIGHT/FULL OUTER JOIN",
      postgresql: "INNER/LEFT/RIGHT/FULL OUTER JOIN",
      mysql: "INNER/LEFT/RIGHT JOIN（FULL OUTER JOINは未サポート）",
      notes: "MySQLではFULL OUTER JOINが使用できない",
    },
    {
      id: "window",
      category: "ウィンドウ関数",
      feature: "ROW_NUMBER（行番号）",
      description: "行に連番を付ける",
      oracle: "ROW_NUMBER() OVER (ORDER BY column)",
      postgresql: "ROW_NUMBER() OVER (ORDER BY column)",
      mysql: "ROW_NUMBER() OVER (ORDER BY column)（8.0以降）",
      notes: "MySQL 8.0未満では使用不可",
    },
    {
      id: "rank",
      category: "ウィンドウ関数",
      feature: "RANK（順位付け）",
      description: "値に基づいて順位を付ける",
      oracle: "RANK() OVER (ORDER BY column)",
      postgresql: "RANK() OVER (ORDER BY column)",
      mysql: "RANK() OVER (ORDER BY column)（8.0以降）",
      notes: "MySQL 8.0未満では使用不可",
    },
    {
      id: "cte",
      category: "共通テーブル式",
      feature: "WITH句（CTE）",
      description: "共通テーブル式を定義する",
      oracle: "WITH cte_name AS (SELECT ...) SELECT ... FROM cte_name",
      postgresql: "WITH cte_name AS (SELECT ...) SELECT ... FROM cte_name",
      mysql: "WITH cte_name AS (SELECT ...) SELECT ... FROM cte_name（8.0以降）",
      notes: "MySQL 8.0未満では使用不可",
    },
    {
      id: "upsert",
      category: "データ操作",
      feature: "UPSERT（挿入または更新）",
      description: "存在しない場合は挿入、存在する場合は更新",
      oracle: "MERGE INTO ... USING ... ON ... WHEN MATCHED THEN UPDATE WHEN NOT MATCHED THEN INSERT",
      postgresql: "INSERT ... ON CONFLICT DO UPDATE",
      mysql: "INSERT ... ON DUPLICATE KEY UPDATE",
      notes: "各DBで構文が大きく異なる",
    },
    {
      id: "recursive",
      category: "再帰クエリ",
      feature: "再帰CTE",
      description: "再帰的な共通テーブル式",
      oracle: "WITH ... CONNECT BY",
      postgresql: "WITH RECURSIVE ...",
      mysql: "WITH RECURSIVE ...（8.0以降）",
      notes: "Oracleは独自のCONNECT BY構文、他DBはWITH RECURSIVEを使用",
    },
    {
      id: "pivot",
      category: "データ変換",
      feature: "PIVOT（行列変換）",
      description: "行データを列に変換する",
      oracle: "SELECT ... FROM ... PIVOT (aggregate FOR column IN (values))",
      postgresql: "crosstab関数またはCASE文で代用",
      mysql: "CASE文で代用",
      notes: "Oracleのみネイティブサポート。他DBはCASE文で代用が必要",
    },
  ]

  // フィルタリング処理
  const filteredFunctions = sqlFunctions.filter(
    (func) =>
      func.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredSyntaxes = sqlSyntaxes.filter(
    (syntax) =>
      syntax.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      syntax.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      syntax.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isClient) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <DatabaseIcon className="h-7 w-7" />
            SQL非互換一覧表
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Oracle、PostgreSQL、MySQLの関数・構文の非互換性を一覧で確認できます。DB移行時の参考にご活用ください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 検索エリア */}
          <div className="space-y-4">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="関数名、機能名、説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* タブエリア */}
          <Tabs defaultValue="functions" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="functions">関数一覧</TabsTrigger>
              <TabsTrigger value="syntax">構文一覧</TabsTrigger>
            </TabsList>

            {/* 関数一覧タブ */}
            <TabsContent value="functions" className="space-y-4">
              <h2 className="text-xl font-semibold">関数一覧 ({filteredFunctions.length}件)</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        カテゴリ
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        関数名
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        説明
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-orange-600">
                        Oracle
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-blue-600">
                        PostgreSQL
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-green-600">
                        MySQL
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFunctions.map((func) => (
                      <tr key={func.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm">
                          {func.category}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">
                          {func.functionName}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm">
                          {func.description}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <code className="text-sm bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                            {func.oracle}
                          </code>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <code className="text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            {func.postgresql}
                          </code>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <code className="text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                            {func.mysql}
                          </code>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {func.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* 構文一覧タブ */}
            <TabsContent value="syntax" className="space-y-4">
              <h2 className="text-xl font-semibold">構文一覧 ({filteredSyntaxes.length}件)</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        カテゴリ
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        機能名
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        説明
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-orange-600">
                        Oracle
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-blue-600">
                        PostgreSQL
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-green-600">
                        MySQL
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSyntaxes.map((syntax) => (
                      <tr key={syntax.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm">
                          {syntax.category}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">
                          {syntax.feature}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm">
                          {syntax.description}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <code className="text-sm bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                            {syntax.oracle}
                          </code>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <code className="text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            {syntax.postgresql}
                          </code>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <code className="text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                            {syntax.mysql}
                          </code>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {syntax.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>

          {/* 使用方法 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">💡 使用方法</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>1. タブ切り替え:</strong> 「関数一覧」と「構文一覧」を切り替えて確認できます
              </p>
              <p>
                <strong>2. 検索機能:</strong> 関数名や機能名、説明で検索してフィルタリングできます
              </p>
              <p>
                <strong>3. 構文確認:</strong> 各データベースでの構文の違いを一覧で確認できます
              </p>
              <p>
                <strong>4. 備考欄:</strong> 移行時の注意点や代替手法を確認できます
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
