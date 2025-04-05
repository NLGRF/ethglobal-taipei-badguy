"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MetaMaskConnector } from "@/components/metamask-connector"
import { Loader2 } from "lucide-react"
import { WalletModal } from "@/components/wallet-modal"
import { TransactionStatus } from "@/components/transaction-status"

interface ChainData {
  chain: string
  gasName: string
  price: number
  gasUnit: string
  gasAmount: number
  usdcPrice: number
}

const CHAIN_IDS = {
  ethereum: "0x1", // Mainnet
  base: "0x2105", // Base Mainnet
  linea: "0xe708", // Linea Mainnet
}

const CHAIN_NAMES: Record<string, string> = Object.entries(CHAIN_IDS).reduce(
  (acc, [name, id]) => {
    acc[id] = name
    return acc
  },
  {} as Record<string, string>,
)

export default function CryptoInterface() {
  const [usdcAmount, setUsdcAmount] = useState("")
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [apiData, setApiData] = useState<ChainData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDataBeenFetched, setHasDataBeenFetched] = useState(false)
  const [currentChainId, setCurrentChainId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState("")
  const [destinationWallet, setDestinationWallet] = useState("")
  const [transactionStatus, setTransactionStatus] = useState<"loading" | "success" | "error" | null>(null)

  useEffect(() => {
    const getCurrentChain = async () => {
      if (isWalletConnected && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          setCurrentChainId(chainId)
          console.log("Current chain ID:", chainId)
        } catch (err) {
          console.error("Error getting chain ID:", err)
        }
      }
    }

    getCurrentChain()
  }, [isWalletConnected])

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true)
    setWalletAddress(address)
  }

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
    setCurrentChainId(null)
  }

  const handleChainChanged = (chainId: string) => {
    setCurrentChainId(chainId)
    console.log("Chain changed to:", chainId)

    const chainName = CHAIN_NAMES[chainId] || "Unknown Network"
    console.log("Chain name:", chainName)

    if (isModalOpen) {
      setIsModalOpen(false)
    }

    if (selectedChain && CHAIN_IDS[selectedChain.toLowerCase() as keyof typeof CHAIN_IDS] === chainId) {
      console.log("Chain matches selected chain:", selectedChain)
    } else {
      setSelectedChain("")
    }
  }

  const fetchData = async () => {
    if (!usdcAmount || isNaN(Number(usdcAmount))) {
      setError("Please enter a valid number")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://7ad9-219-68-124-60.ngrok-free.app/price?amount=${usdcAmount}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setApiData(data)
      setHasDataBeenFetched(true)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data. Please try again.")
      setApiData([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals)
  }

  const getChainLogo = (chain: string) => {
    switch (chain.toLowerCase()) {
      case "ethereum":
        return (
          <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 1.75L5.75 12.25L12 16L18.25 12.25L12 1.75Z" stroke="white" fill="white" />
            <path d="M12 16L5.75 12.25L12 22.25L18.25 12.25L12 16Z" stroke="white" fill="white" opacity="0.6" />
          </svg>
        )
      case "base":
        return (
          <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10" fill="white" />
            <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" fill="black" />
          </svg>
        )
      case "linea":
        return (
          <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="white" />
            <path d="M7 12L17 12M12 7L12 17" stroke="black" strokeWidth="2" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        )
    }
  }

  const isChainSelected = (chain: string) => {
    if (!currentChainId) return false
    const chainId = CHAIN_IDS[chain.toLowerCase() as keyof typeof CHAIN_IDS]
    return chainId === currentChainId
  }

  const handleSelectChain = async (chain: string) => {
    if (!isWalletConnected) {
      setError("Please connect your wallet first")
      return
    }

    setError(null)

    if (!window.ethereum) {
      setError("MetaMask is not installed or not accessible")
      return
    }

    const chainId = CHAIN_IDS[chain.toLowerCase() as keyof typeof CHAIN_IDS]
    if (chainId === currentChainId) {
      console.log(`Already on ${chain} network`)
      setSelectedChain(chain)
      setIsModalOpen(true)
      return
    }

    try {
      if (!chainId) {
        throw new Error(`Chain ID not found for ${chain}`)
      }

      console.log(`Attempting to switch to chain: ${chain} (${chainId})`)

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        })

        console.log(`Successfully switched to ${chain}`)
        setCurrentChainId(chainId)
        setSelectedChain(chain)
        setIsModalOpen(true)
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          console.log(`${chain} network not found, attempting to add it`)
          const added = await addNetwork(chain)
          if (added) {
            await window.ethereum!.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId }],
            })

            setCurrentChainId(chainId)
            setSelectedChain(chain)
            setIsModalOpen(true)
          } else {
            setError(`Failed to add ${chain} network to your wallet`)
          }
        } else {
          throw switchError
        }
      }
    } catch (err: any) {
      console.error("Error switching network:", err)

      if (err.code === 4001) {
        setError("Network switch was rejected")
      } else {
        setError(`Failed to switch to ${chain} network: ${err.message || "Unknown error"}`)
      }
    }
  }

  const addNetwork = async (chain: string) => {
    if (!window.ethereum) return false

    try {
      const chainId = CHAIN_IDS[chain.toLowerCase() as keyof typeof CHAIN_IDS]

      if (!chainId) {
        throw new Error(`Chain ID not found for ${chain}`)
      }

      const networkParams: Record<string, any> = {
        ethereum: {
          chainId,
          chainName: "Ethereum Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://mainnet.infura.io/v3/"],
          blockExplorerUrls: ["https://etherscan.io"],
        },
        base: {
          chainId,
          chainName: "Base Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"],
        },
        linea: {
          chainId,
          chainName: "Linea Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://rpc.linea.build"],
          blockExplorerUrls: ["https://lineascan.build"],
        },
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [networkParams[chain.toLowerCase()]],
      })

      return true
    } catch (error) {
      console.error(`Error adding ${chain} network:`, error)
      return false
    }
  }

  const processTransaction = async (destinationAddress: string) => {
    setIsModalOpen(false)
    setTransactionStatus("loading")

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setTransactionStatus("success")
      console.log(`Transaction successful: ${usdcAmount} USDC to ${destinationAddress} on ${selectedChain}`)
      setError(null)
    } catch (err: any) {
      console.error("Transaction error:", err)
      setError(`Transaction failed: ${err.message || "Unknown error"}`)
      setTransactionStatus("error")
    }
  }

  const handleModalConfirm = (destinationAddress: string) => {
    setDestinationWallet(destinationAddress)
    processTransaction(destinationAddress)
  }

  const resetTransactionStatus = () => {
    setTransactionStatus(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border border-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="border border-white p-4 flex items-center justify-center w-16 h-12">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="px-6 py-2">BadGuy</div>
        </div>
        <MetaMaskConnector
          onConnect={handleWalletConnect}
          onDisconnect={handleWalletDisconnect}
          isConnected={isWalletConnected}
          walletAddress={walletAddress}
          onChainChanged={handleChainChanged}
        />
      </header>

      {/* Main Content */}
      <main className="p-4 flex flex-col gap-6">
        <div className="flex gap-4 mt-24 mb-8">
          <Input
            placeholder="input usdc"
            className="border border-white bg-black text-white h-16 text-center text-lg"
            value={usdcAmount}
            onChange={(e) => setUsdcAmount(e.target.value)}
            type="number"
          />
          <Button
            variant="outline"
            className="border border-white text-white hover:bg-white hover:text-black transition-colors min-w-[200px]"
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : hasDataBeenFetched ? (
              "refresh"
            ) : (
              "confirm"
            )}
          </Button>
        </div>

        {error && <div className="text-red-500 text-center">{error}</div>}

        {/* Option Cards */}
        {apiData.length > 0 && (
          <div className="space-y-6">
            {!isWalletConnected && (
              <div className="text-center p-4 border border-white mb-4">
                Please connect your wallet to select a network
              </div>
            )}
            {apiData.map((item, index) => (
              <Card
                key={index}
                className={`border border-white bg-black p-4 flex justify-between items-center ${
                  isChainSelected(item.chain) ? "border-green-500 border-2" : ""
                }`}
              >
                <div className="border border-white p-8 flex items-center justify-center w-24 h-24">
                  {getChainLogo(item.chain)}
                </div>
                <div className="border border-white p-4 flex flex-col items-center justify-center min-w-[200px] h-16">
                  <div className="font-bold">{item.chain}</div>
                  <div className="text-sm">
                    {formatNumber(item.price)} USD | Gas: {formatNumber(item.gasAmount, 6)} {item.gasUnit}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className={`border border-white text-white hover:bg-white hover:text-black transition-colors min-w-[150px] ${
                    isChainSelected(item.chain) ? "bg-green-900 border-green-500" : ""
                  }`}
                  onClick={() => handleSelectChain(item.chain)}
                  disabled={transactionStatus === "loading" || !isWalletConnected}
                >
                  {isChainSelected(item.chain) ? "Continue" : "Select"}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Wallet Modal */}
        <WalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleModalConfirm}
          selectedChain={selectedChain}
        />

        {/* Transaction Status */}
        <TransactionStatus status={transactionStatus} onClose={resetTransactionStatus} />
      </main>
    </div>
  )
} 