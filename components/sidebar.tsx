"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PuzzleIcon, FileTextIcon, NetworkIcon, FolderSyncIcon, DownloadIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion" // Accordionコンポーネントをインポート

export function Sidebar() {
  const pathname = usePathname()

  const navCategories = [
    {
      title: "基本ツール",
      value: "basic-tools", // AccordionItem の value
      items: [
        {
          name: "一括置換ツール",
          href: "/bulk-replace",
          icon: PuzzleIcon,
        },
        {
          name: "BOM除去／変換ツール",
          href: "/bom-converter",
          icon: FileTextIcon,
        },
        {
          name: "一括リネームツール",
          href: "/batch-rename",
          icon: FolderSyncIcon,
        },
      ],
    },
    {
      title: "ネットワークツール",
      value: "network-tools", // AccordionItem の value
      items: [
        {
          name: "CIDR計算ツール",
          href: "/cidr-calculator",
          icon: NetworkIcon,
        },
      ],
    },
    {
      title: "補助機能",
      value: "utility-features", // AccordionItem の value
      items: [
        {
          name: "操作ログダウンロード",
          href: "/log-download",
          icon: DownloadIcon,
        },
      ],
    },
  ]

  // 現在のパスに基づいて、アクティブなカテゴリをデフォルトで開くための処理
  const defaultOpenCategories = navCategories
    .filter((category) => category.items.some((item) => pathname === item.href))
    .map((category) => category.value)

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col shadow-md">
      <div className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Dev Utility Box</div>
      <nav className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={defaultOpenCategories} className="w-full">
          {navCategories.map((category) => (
            <AccordionItem key={category.value} value={category.value} className="border-b-0">
              <AccordionTrigger className="py-2 px-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                {category.title}
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="space-y-1 pl-3">
                  {" "}
                  {/* 項目を少しインデント */}
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                        pathname === item.href &&
                          "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    </aside>
  )
}
