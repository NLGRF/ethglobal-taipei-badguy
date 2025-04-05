"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"

interface ContractInfo {
  name: string
  address: string
  description: string
}

export function ContractOverview() {
  const [activeTab, setActiveTab] = useState<string>("ethereum")
  const [activeMode, setActiveMode] = useState<string>("testnet")
  const [copied, setCopied] = useState<string | null>(null)

  // Updated contract data for each chain based on Circle's official implementation
  const contracts = {
    testnet: {
      ethereum: [
        {
          name: "USDC",
          address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          description: "USDC token contract on Ethereum Sepolia",
        },
        {
          name: "TokenMessenger",
          address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
          description: "CCTP TokenMessenger contract for initiating transfers",
        },
        {
          name: "MessageTransmitter",
          address: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
          description: "CCTP MessageTransmitter contract for receiving messages",
        },
      ],
      base: [
        {
          name: "USDC",
          address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          description: "USDC token contract on Base Sepolia",
        },
        {
          name: "TokenMessenger",
          address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
          description: "CCTP TokenMessenger contract for initiating transfers",
        },
        {
          name: "MessageTransmitter",
          address: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
          description: "CCTP MessageTransmitter contract for receiving messages",
        },
      ],
      linea: [
        {
          name: "USDC",
          address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
          description: "USDC token contract on Linea Sepolia",
        },
        {
          name: "TokenMessenger",
          address: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
          description: "CCTP TokenMessenger contract for initiating transfers",
        },
        {
          name: "MessageTransmitter",
          address: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
          description: "CCTP MessageTransmitter contract for receiving messages",
        },
      ],
    },
    mainnet: {
      ethereum: [
        {
          name: "USDC",
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          description: "USDC token contract on Ethereum Mainnet",
        },
        {
          name: "TokenMessenger",
          address: "0xBd3fa81B58Ba92a82136038B25aDec7066AF3155",
          description: "CCTP TokenMessenger contract for initiating transfers",
        },
        {
          name: "MessageTransmitter",
          address: "0x0a992d191deec32afe36203ad87d7d289a738f81",
          description: "CCTP MessageTransmitter contract for receiving messages",
        },
      ],
      base: [
        {
          name: "USDC",
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          description: "USDC token contract on Base Mainnet",
        },
        {
          name: "TokenMessenger",
          address: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
          description: "CCTP TokenMessenger contract for initiating transfers",
        },
        {
          name: "MessageTransmitter",
          address: "0x9ff9a4da6f2157a9c82ce756f8fd7e0d75be8895",
          description: "CCTP MessageTransmitter contract for receiving messages",
        },
      ],
      linea: [
        {
          name: "USDC",
          address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
          description: "USDC token contract on Linea Mainnet",
        },
        {
          name: "TokenMessenger",
          address: "0xd9eD2B3446D9f428e158B1Be4c7Ae94c4d5f9e9A",
          description: "CCTP TokenMessenger contract for initiating transfers",
        },
        {
          name: "MessageTransmitter",
          address: "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8",
          description: "CCTP MessageTransmitter contract for receiving messages",
        },
      ],
    },
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const getExplorerUrl = (address: string, chain: string) => {
    const explorers = {
      testnet: {
        ethereum: "https://sepolia.etherscan.io/address/",
        base: "https://sepolia.basescan.org/address/",
        linea: "https://sepolia.lineascan.build/address/",
      },
      mainnet: {
        ethereum: "https://etherscan.io/address/",
        base: "https://basescan.org/address/",
        linea: "https://lineascan.build/address/",
      },
    }

    return `${explorers[activeMode as keyof typeof explorers][chain as keyof typeof explorers.testnet]}${address}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border border-white">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>CCTP Contracts</span>
          <div className="flex gap-2">
            <Button
              variant={activeMode === "testnet" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMode("testnet")}
              className={activeMode === "testnet" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            >
              Testnet
            </Button>
            <Button
              variant={activeMode === "mainnet" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMode("mainnet")}
              className={activeMode === "mainnet" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Mainnet
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ethereum" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
            <TabsTrigger value="base">Base</TabsTrigger>
            <TabsTrigger value="linea">Linea</TabsTrigger>
          </TabsList>

          {Object.keys(contracts.testnet).map((chain) => (
            <TabsContent key={chain} value={chain} className="space-y-4">
              {contracts[activeMode as keyof typeof contracts][chain as keyof typeof contracts.testnet].map(
                (contract, index) => (
                  <div key={index} className="border border-gray-800 rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{contract.name}</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(contract.address, `${chain}-${contract.name}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <a
                          href={getExplorerUrl(contract.address, chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {copied === `${chain}-${contract.name}` && (
                          <span className="text-xs text-green-500">Copied!</span>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-sm bg-gray-900 p-2 rounded mb-2 break-all">{contract.address}</div>
                    <p className="text-sm text-gray-400">{contract.description}</p>
                  </div>
                ),
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 border border-gray-800 rounded bg-gray-900/30">
          <h3 className="font-bold mb-2">เกี่ยวกับ CCTP</h3>
          <p className="text-sm">
            Cross-Chain Transfer Protocol (CCTP) เป็นโปรโตคอลที่พัฒนาโดย Circle สำหรับการโอน USDC ระหว่าง blockchain ต่างๆ
            โดยรักษาอัตราส่วน 1:1 ในการโอน ซึ่งหมายความว่าจำนวน USDC ที่ส่งจากต้นทางจะเท่ากับจำนวนที่ได้รับที่ปลายทางพอดี
          </p>
          <p className="text-sm mt-2">
            โปรโตคอลนี้ใช้ TokenMessenger contract สำหรับเริ่มการโอนและ MessageTransmitter contract สำหรับรับข้อความและทำการ mint
            USDC ที่ปลายทาง
          </p>
          <p className="text-sm mt-2">
            <a
              href="https://github.com/circlefin/cctp-sample-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>ดูตัวอย่างการใช้งาน CCTP จาก Circle</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

