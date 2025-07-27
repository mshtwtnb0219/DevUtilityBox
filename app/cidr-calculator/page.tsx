"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { NetworkIcon, Calculator, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface NetworkInfo {
  ipAddress: string
  subnetMask: string
  networkAddress: string
  broadcastAddress: string
  hostRange: { start: string; end: string }
  totalAddresses: number
  usableAddresses: number
  addressClass: string
  cidrNotation: string
}

export default function CidrCalculatorPage() {
  const [ipAddress, setIpAddress] = useState("192.168.1.100")
  const [subnetMask, setSubnetMask] = useState("255.255.255.0")
  const [displayFormat, setDisplayFormat] = useState<"decimal" | "binary" | "hex">("decimal")
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [errors, setErrors] = useState<{ ip?: string; mask?: string }>({})

  // IPアドレスのバリデーション
  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = ip.match(ipRegex)
    if (!match) return false

    return match.slice(1).every((octet) => {
      const num = Number.parseInt(octet, 10)
      return num >= 0 && num <= 255
    })
  }

  // サブネットマスクのバリデーション
  const validateSubnetMask = (mask: string): boolean => {
    if (!validateIP(mask)) return false

    const octets = mask.split(".").map((octet) => Number.parseInt(octet, 10))
    const binaryMask = octets.map((octet) => octet.toString(2).padStart(8, "0")).join("")

    // 連続する1の後に連続する0があるかチェック
    const validPattern = /^1*0*$/
    return validPattern.test(binaryMask)
  }

  // IPアドレスを数値に変換
  const ipToNumber = (ip: string): number => {
    return (
      ip.split(".").reduce((acc, octet, index) => {
        return acc + (Number.parseInt(octet, 10) << (8 * (3 - index)))
      }, 0) >>> 0
    )
  }

  // 数値をIPアドレスに変換
  const numberToIp = (num: number): string => {
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".")
  }

  // アドレスクラスを判定
  const getAddressClass = (ip: string): string => {
    const firstOctet = Number.parseInt(ip.split(".")[0], 10)
    if (firstOctet >= 1 && firstOctet <= 126) return "A"
    if (firstOctet >= 128 && firstOctet <= 191) return "B"
    if (firstOctet >= 192 && firstOctet <= 223) return "C"
    if (firstOctet >= 224 && firstOctet <= 239) return "D (マルチキャスト)"
    if (firstOctet >= 240 && firstOctet <= 255) return "E (実験用)"
    return "不明"
  }

  // CIDR記法を取得
  const getCidrNotation = (mask: string): string => {
    const octets = mask.split(".").map((octet) => Number.parseInt(octet, 10))
    const binaryMask = octets.map((octet) => octet.toString(2).padStart(8, "0")).join("")
    const prefixLength = binaryMask.split("1").length - 1
    return `/${prefixLength}`
  }

  // 進数変換
  const formatAddress = (ip: string, format: "decimal" | "binary" | "hex"): string => {
    const octets = ip.split(".").map((octet) => Number.parseInt(octet, 10))

    switch (format) {
      case "binary":
        return octets.map((octet) => octet.toString(2).padStart(8, "0")).join(".")
      case "hex":
        return octets.map((octet) => "0x" + octet.toString(16).toUpperCase().padStart(2, "0")).join(".")
      default:
        return ip
    }
  }

  // ネットワーク情報を計算
  const calculateNetwork = () => {
    const newErrors: { ip?: string; mask?: string } = {}

    if (!validateIP(ipAddress)) {
      newErrors.ip = "有効なIPアドレスを入力してください"
    }

    if (!validateSubnetMask(subnetMask)) {
      newErrors.mask = "有効なサブネットマスクを入力してください"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      setNetworkInfo(null)
      return
    }

    const ipNum = ipToNumber(ipAddress)
    const maskNum = ipToNumber(subnetMask)
    const networkNum = ipNum & maskNum
    const broadcastNum = networkNum | (~maskNum >>> 0)

    const hostStartNum = networkNum + 1
    const hostEndNum = broadcastNum - 1

    const totalAddresses = broadcastNum - networkNum + 1
    const usableAddresses = Math.max(0, totalAddresses - 2)

    setNetworkInfo({
      ipAddress,
      subnetMask,
      networkAddress: numberToIp(networkNum),
      broadcastAddress: numberToIp(broadcastNum),
      hostRange: {
        start: numberToIp(hostStartNum),
        end: numberToIp(hostEndNum),
      },
      totalAddresses,
      usableAddresses,
      addressClass: getAddressClass(ipAddress),
      cidrNotation: getCidrNotation(subnetMask),
    })
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <NetworkIcon className="h-7 w-7" />
            CIDR計算ツール
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            IPアドレスとサブネットマスクからネットワーク情報を計算します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 入力エリア */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                入力
              </h2>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="ip-address">IPアドレス</Label>
                  <Input
                    id="ip-address"
                    placeholder="例: 192.168.1.100"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className={errors.ip ? "border-red-500" : ""}
                  />
                  {errors.ip && <p className="text-sm text-red-500">{errors.ip}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subnet-mask">サブネットマスク</Label>
                  <Input
                    id="subnet-mask"
                    placeholder="例: 255.255.255.0"
                    value={subnetMask}
                    onChange={(e) => setSubnetMask(e.target.value)}
                    className={errors.mask ? "border-red-500" : ""}
                  />
                  {errors.mask && <p className="text-sm text-red-500">{errors.mask}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="display-format">表示形式</Label>
                  <Select
                    value={displayFormat}
                    onValueChange={(value: "decimal" | "binary" | "hex") => setDisplayFormat(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decimal">10進数</SelectItem>
                      <SelectItem value="binary">2進数</SelectItem>
                      <SelectItem value="hex">16進数</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* アドレスクラス情報 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Info className="h-5 w-5" />
                アドレスクラス情報
              </h2>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">クラス A:</span>
                    <p className="text-gray-600 dark:text-gray-400">1.0.0.0 - 126.255.255.255</p>
                    <p className="text-gray-600 dark:text-gray-400">デフォルト: /8</p>
                  </div>
                  <div>
                    <span className="font-medium">クラス B:</span>
                    <p className="text-gray-600 dark:text-gray-400">128.0.0.0 - 191.255.255.255</p>
                    <p className="text-gray-600 dark:text-gray-400">デフォルト: /16</p>
                  </div>
                  <div>
                    <span className="font-medium">クラス C:</span>
                    <p className="text-gray-600 dark:text-gray-400">192.0.0.0 - 223.255.255.255</p>
                    <p className="text-gray-600 dark:text-gray-400">デフォルト: /24</p>
                  </div>
                  <div>
                    <span className="font-medium">プライベート:</span>
                    <p className="text-gray-600 dark:text-gray-400">10.0.0.0/8, 172.16.0.0/12</p>
                    <p className="text-gray-600 dark:text-gray-400">192.168.0.0/16</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 実行ボタン */}
          <div className="flex justify-center">
            <Button
              onClick={calculateNetwork}
              disabled={!ipAddress || !subnetMask}
              className="px-8 py-2 text-lg flex items-center gap-2"
            >
              <Calculator className="h-5 w-5" />
              計算実行
            </Button>
          </div>

          <Separator />

          {/* 計算結果 */}
          {networkInfo && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">計算結果</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">基本情報</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">IPアドレス:</span>
                        <span className="font-mono">{formatAddress(networkInfo.ipAddress, displayFormat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">サブネットマスク:</span>
                        <span className="font-mono">{formatAddress(networkInfo.subnetMask, displayFormat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">CIDR記法:</span>
                        <span className="font-mono">
                          {networkInfo.ipAddress}
                          {networkInfo.cidrNotation}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">アドレスクラス:</span>
                        <Badge variant="outline">{networkInfo.addressClass}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-300 mb-3">ネットワーク情報</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">ネットワークアドレス:</span>
                        <span className="font-mono">{formatAddress(networkInfo.networkAddress, displayFormat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">ブロードキャストアドレス:</span>
                        <span className="font-mono">{formatAddress(networkInfo.broadcastAddress, displayFormat)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-3">ホスト範囲</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">開始アドレス:</span>
                        <span className="font-mono">{formatAddress(networkInfo.hostRange.start, displayFormat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">終了アドレス:</span>
                        <span className="font-mono">{formatAddress(networkInfo.hostRange.end, displayFormat)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">アドレス数</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">総アドレス数:</span>
                        <span className="font-mono">{networkInfo.totalAddresses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">利用可能アドレス数:</span>
                        <span className="font-mono">{networkInfo.usableAddresses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 補足情報 */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  利用可能アドレス数は、ネットワークアドレスとブロードキャストアドレスを除いた数です。
                  実際にホストに割り当て可能なアドレスの数を表しています。
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
