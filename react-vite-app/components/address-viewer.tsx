"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface ContractAddresses {
  [key: string]: {
    chainId: string
    rpc: string
    usdc: string
    tokenMessenger: string
    msgTransmitter: string
  }
}

export function AddressViewer() {
  const [addresses, setAddresses] = useState<ContractAddresses>({})
  const [activeTab, setActiveTab] = useState<string>("ethereum")
  const [copied, setCopied] = useState<string | null>(null)
  const [appMode, setAppMode] = useState<string>("development")

  useEffect(() => {
    // In a real app, this would come from environment variables
    // For this demo, we'll use the values from the provided config
    const mode = process.env.NEXT_PUBLIC_APP_MODE || "development"
    setAppMode(mode)

    // Mock data based on the provided configuration
    const mockAddresses: ContractAddresses = {
      ethereum: {
        chainId: mode === "development" ? "11155111" : "1",
        rpc: mode === "development" ? "https://sepolia.infura.io/v3/xxx" : "https://mainnet.infura.io/v3/xxx",
        usdc: "0x...",
        tokenMessenger: "0xbdA0b0Fc6Fc4Ea8B6Cb7B1E2E6E5E4E3E2E1E0",
        msgTransmitter: "0x8dA0b0Fc6Fc4Ea8B6Cb7B1E2E6E5E4E3E2E1E0",
      },
      base: {
        chainId: mode === "development" ? "84532" : "8453",
        rpc: mode === "development" ? "https://sepolia.base.org" : "https://mainnet.base.org",
        usdc: "0x...",
        tokenMessenger: "0xbdA0b0Fc6Fc4Ea8B6Cb7B1E2E6E5E4E3E2E1E0",
        msgTransmitter: "0x8dA0b0Fc6Fc4Ea8B6Cb7B1E2E6E5E4E3E2E1E0",
      },
      linea: {
        chainId: mode === "development" ? "59141" : "59144",
        rpc: mode === "development" ? "https://rpc.goerli.linea.build" : "https://rpc.linea.build",
        usdc: "0x...",
        tokenMessenger: "0xbdA0b0Fc6Fc4Ea8B6Cb7B1E2E6E5E4E3E2E1E0",
        msgTransmitter: "0x8dA0b0Fc6Fc4Ea8B6Cb7B1E2E6E5E4E3E2E1E0",
      },
    }

    setAddresses(mockAddresses)
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatAddress = (address: string) => {
    if (address === "0x...") return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border border-white">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Contract Addresses</span>
          <span className="text-sm font-normal bg-yellow-600 px-2 py-1 rounded">{appMode.toUpperCase()} MODE</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ethereum" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
            <TabsTrigger value="base">Base</TabsTrigger>
            <TabsTrigger value="linea">Linea</TabsTrigger>
          </TabsList>

          {Object.keys(addresses).map((network) => (
            <TabsContent key={network} value={network} className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="font-semibold">Chain ID</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-sm">{addresses[network]?.chainId}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(addresses[network]?.chainId, `${network}-chainId`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied === `${network}-chainId` && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="font-semibold">RPC URL</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-sm truncate max-w-[300px]">
                      {addresses[network]?.rpc}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(addresses[network]?.rpc, `${network}-rpc`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied === `${network}-rpc` && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="font-semibold">USDC</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-sm">
                      {formatAddress(addresses[network]?.usdc)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(addresses[network]?.usdc, `${network}-usdc`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied === `${network}-usdc` && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="font-semibold">Token Messenger</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-sm">
                      {formatAddress(addresses[network]?.tokenMessenger)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(addresses[network]?.tokenMessenger, `${network}-tokenMessenger`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied === `${network}-tokenMessenger` && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="font-semibold">Message Transmitter</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-sm">
                      {formatAddress(addresses[network]?.msgTransmitter)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(addresses[network]?.msgTransmitter, `${network}-msgTransmitter`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied === `${network}-msgTransmitter` && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 border border-yellow-600 rounded bg-yellow-600/10">
          <h3 className="font-bold mb-2">Security Note</h3>
          <p className="text-sm">
            The private key is not displayed for security reasons. Never expose your private key in client-side code or
            share it with others.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

