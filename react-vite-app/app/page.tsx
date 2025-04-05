"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MetaMaskConnector } from "@/components/metamask-connector"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { WalletModal } from "@/components/wallet-modal"
import { TransactionStatus } from "@/components/transaction-status"
import { getChainIds, getNetworkParams, createChainNameMapping } from "@/config/chains"
import { depositUSDC } from "@/services/cctp-service"

interface ChainData {
  chain: string
  gasName: string
  price: number
  gasUnit: string
  gasAmount: number
  usdcPrice: number
}

interface GasCostData {
  gasAmount: string
  gasPriceInEther: string
  maxFeeInEther: string
  priorityFeeInEther: string
  totalCostLegacy: string
  totalCostEIP1559Min: string
  totalCostEIP1559Max: string
}

// Get chain IDs based on app mode
const CHAIN_IDS = getChainIds()

// Reverse mapping from chain ID to chain name
const CHAIN_NAMES = createChainNameMapping(CHAIN_IDS)

// API URL from environment variable with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ethglobal-taipei-badguy.onrender.com"

// App mode for development/production
const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "production"

// Sample data for fallback when API is unavailable
const FALLBACK_DATA: ChainData[] = [
  {
    chain: "Ethereum",
    gasName: "ETH",
    price: 3500,
    gasUnit: "gwei",
    gasAmount: 0.000021,
    usdcPrice: 1,
  },
  {
    chain: "Base",
    gasName: "ETH",
    price: 3500,
    gasUnit: "gwei",
    gasAmount: 0.000015,
    usdcPrice: 1,
  },
  {
    chain: "Linea",
    gasName: "ETH",
    price: 3500,
    gasUnit: "gwei",
    gasAmount: 0.000018,
    usdcPrice: 1,
  },
]

// Function to generate realistic fallback data based on input amount
const generateFallbackData = (amount: string): ChainData[] => {
  const inputAmount = Number(amount) || 1
  return FALLBACK_DATA.map((item) => ({
    ...item,
    // Scale gas amount based on input to simulate realistic gas costs
    gasAmount: item.gasAmount * (0.8 + inputAmount * 0.01),
    // Keep price consistent
    price: item.price,
  }))
}

// Function to check API connection
const checkApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    // ทดสอบ endpoint /price โดยตรงแทนที่จะใช้ /health
    const response = await fetch(`${API_URL}/price?amount=1`, {
      signal: controller.signal,
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.error("API connection check failed:", error)
    return false
  }
}

export default function CryptoInterface() {
  const [usdcAmount, setUsdcAmount] = useState("")
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [apiData, setApiData] = useState<ChainData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDataBeenFetched, setHasDataBeenFetched] = useState(false)
  const [currentChainId, setCurrentChainId] = useState<string | null>(null)
  const [currentNetworkName, setCurrentNetworkName] = useState<string | null>(null)
  const [gasCostData, setGasCostData] = useState<Record<string, GasCostData>>({})
  const [useFallbackData, setUseFallbackData] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSourceChain, setSelectedSourceChain] = useState("")
  const [destinationWallet, setDestinationWallet] = useState("")
  const [destinationChain, setDestinationChain] = useState("")

  // Transaction state
  const [transactionStatus, setTransactionStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [transferId, setTransferId] = useState<string | null>(null)

  // Add a state for the detailed error message
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  // Get the current chain when wallet is connected
  useEffect(() => {
    const getCurrentChain = async () => {
      if (isWalletConnected && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          setCurrentChainId(chainId)
          console.log("Current chain ID:", chainId)

          // Update current network name
          const networkName = CHAIN_NAMES[chainId] || null
          setCurrentNetworkName(networkName)
          console.log("Current network name:", networkName)
        } catch (err) {
          console.error("Error getting chain ID:", err)
        }
      } else {
        setCurrentChainId(null)
        setCurrentNetworkName(null)
      }
    }

    getCurrentChain()
  }, [isWalletConnected])

  // Log app mode on component mount
  useEffect(() => {
    console.log(`App Mode: ${APP_MODE}`)
    console.log(`Using ${APP_MODE === "development" ? "TESTNET" : "MAINNET"} chain IDs`)
    console.log("Chain IDs:", CHAIN_IDS)
    console.log("API URL:", API_URL)
  }, [])

  // Load initial data when component mounts
  useEffect(() => {
    // Set a default USDC amount if none is provided
    if (!usdcAmount) {
      setUsdcAmount("10")
    }

    // Check if we should auto-load data
    const shouldAutoLoad = !hasDataBeenFetched && usdcAmount

    if (shouldAutoLoad) {
      console.log("Auto-loading initial data")
      fetchData()
    }
  }, [])

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true)
    setWalletAddress(address)
  }

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
    setCurrentChainId(null)
    setCurrentNetworkName(null)
  }

  // Handle chain changes without refreshing
  const handleChainChanged = (chainId: string) => {
    setCurrentChainId(chainId)
    console.log("Chain changed to:", chainId)

    // Update UI based on the new chain
    const chainName = CHAIN_NAMES[chainId] || null
    setCurrentNetworkName(chainName)
    console.log("Chain name:", chainName)

    // If we were in the middle of a transaction, close any open modals
    if (isModalOpen) {
      setIsModalOpen(false)
    }

    // If we have a selected chain, update it if it matches the new chain
    if (selectedSourceChain && CHAIN_IDS[selectedSourceChain.toLowerCase() as keyof typeof CHAIN_IDS] === chainId) {
      console.log("Chain matches selected chain:", selectedSourceChain)
    } else {
      // Clear selected chain if it doesn't match
      setSelectedSourceChain("")
    }
  }

  // Check if current network is in our list of supported networks
  const isCurrentNetworkSupported = () => {
    if (!currentChainId || !apiData || apiData.length === 0) return false

    // Check if any of the networks in apiData match our current chain
    return apiData.some((item) => {
      const chainId = CHAIN_IDS[item.chain.toLowerCase() as keyof typeof CHAIN_IDS]
      return chainId?.toLowerCase() === currentChainId.toLowerCase()
    })
  }

  // Improved fetchData function with better error handling and immediate fallback
  const fetchData = async () => {
    if (!usdcAmount || isNaN(Number(usdcAmount))) {
      setError("Please enter a valid number")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching price data from: ${API_URL}/price?amount=${usdcAmount}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`${API_URL}/price?amount=${usdcAmount}`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`API error: ${response.status} - ${errorText || "No error details"}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      // ตรวจสอบว่าข้อมูลมีรูปแบบที่ถูกต้อง
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data format received from API")
      }

      // Set the API data
      setApiData(data)
      setHasDataBeenFetched(true)
      setUseFallbackData(false)
    } catch (err: any) {
      console.error("Error fetching data:", err)

      // Provide more detailed error message
      let errorMsg = "Failed to fetch data"

      if (err.name === "AbortError") {
        errorMsg = "Request timed out. The API server might be down or responding slowly."
      } else if (err.message) {
        errorMsg += `: ${err.message}`
      }

      setError(errorMsg)

      // Use fallback data
      console.log("Using fallback data due to API error")
      setApiData(generateFallbackData(usdcAmount))
      setHasDataBeenFetched(true)
      setUseFallbackData(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to format numbers
  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals)
  }

  // Get chain-specific logo
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

  // Check if a chain is currently selected (matches current chain ID)
  const isChainSelected = (chain: string) => {
    if (!currentChainId || !chain) return false

    // Get the chain ID for the given chain name
    const chainId = CHAIN_IDS[chain.toLowerCase() as keyof typeof CHAIN_IDS]

    // Log for debugging
    console.log(`Checking if ${chain} (${chainId}) matches current chain ID: ${currentChainId}`)

    // Compare the chain IDs (case insensitive)
    return chainId?.toLowerCase() === currentChainId?.toLowerCase()
  }

  const fetchGasCost = async (chain: string) => {
    try {
      const chainLower = chain.toLowerCase()
      const PUMP_API_URL = process.env.NEXT_PUBLIC_PUMP_API_URL || "https://pump-apis.onrender.com"
      const response = await fetch(`${PUMP_API_URL}/gas/cost/${chainLower}`)

      if (!response.ok) {
        console.error(`Failed to fetch gas cost for ${chain}: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (data.success && data.data) {
        console.log(`Gas cost data for ${chain}:`, data.data)
        // Update the gas cost data state
        setGasCostData((prev) => ({
          ...prev,
          [chainLower]: data.data,
        }))
        return data.data
      } else {
        console.error(`Invalid gas cost data for ${chain}:`, data)
        return null
      }
    } catch (error) {
      console.error(`Error fetching gas cost for ${chain}:`, error)
      return null
    }
  }

  // Add a validation function to check if total cost exceeds input USDC amount
  const isTotalCostExceedsInput = (chainName: string, ethPrice: number) => {
    if (!usdcAmount || isNaN(Number(usdcAmount))) return false

    const inputUsdcValue = Number(usdcAmount)
    const costCalculation = calculateUsdCost(chainName, ethPrice)

    if (!costCalculation) return false

    return costCalculation.usdCost > inputUsdcValue
  }

  // Improved addNetwork function with better error handling
  const addNetwork = async (chain: string) => {
    if (!window.ethereum) return { success: false, rejected: false }

    try {
      const chainId = CHAIN_IDS[chain.toLowerCase() as keyof typeof CHAIN_IDS]

      if (!chainId) {
        console.error(`Chain ID not found for ${chain}`)
        return { success: false, rejected: false }
      }

      // Get network parameters based on app mode
      const networkParams = getNetworkParams()
      const params = networkParams[chain.toLowerCase() as keyof typeof networkParams]

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [params],
      })

      return { success: true, rejected: false }
    } catch (error: any) {
      console.error(`Error adding ${chain} network:`, error)

      // Check if the user rejected the request
      const isRejected = error.code === 4001 || (error.message && error.message.includes("rejected"))

      if (isRejected) {
        console.log(`User rejected adding ${chain} network`)
        return { success: false, rejected: true }
      }

      return { success: false, rejected: false }
    }
  }

  // Update the handleSelectChain function to switch networks first
  const handleSelectChain = async (chain: string) => {
    if (!isWalletConnected) {
      setError("Please connect your wallet first")
      return
    }

    setError(null)

    // Check if total cost exceeds input USDC amount
    const chainData = apiData.find((item) => item.chain.toLowerCase() === chain.toLowerCase())
    if (chainData && isTotalCostExceedsInput(chain, chainData.price)) {
      // Just show a warning but continue with selection
      setError("Warning: Gas cost exceeds input USDC amount. You may need to increase your input.")
    }

    // Fetch gas cost data for the selected chain
    await fetchGasCost(chain)

    // First check if MetaMask is available
    if (!window.ethereum) {
      setError("MetaMask is not installed or not accessible")
      return
    }

    // Check if we're already on the selected chain
    const chainId = CHAIN_IDS[chain.toLowerCase() as keyof typeof CHAIN_IDS]
    if (chainId?.toLowerCase() === currentChainId?.toLowerCase()) {
      console.log(`Already on ${chain} network`)
      setSelectedSourceChain(chain)
      setIsModalOpen(true)
      return
    }

    try {
      if (!chainId) {
        throw new Error(`Chain ID not found for ${chain}`)
      }

      console.log(`Attempting to switch to chain: ${chain} (${chainId})`)
      console.log(`Network mode: ${APP_MODE === "development" ? "TESTNET" : "MAINNET"}`)

      try {
        // Request network switch
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        })

        console.log(`Successfully switched to ${chain}`)

        // Update current chain ID
        setCurrentChainId(chainId)
        setCurrentNetworkName(chain)

        // If successful, open the modal
        setSelectedSourceChain(chain)
        setIsModalOpen(true)
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          console.log(`${chain} network not found, attempting to add it`)

          try {
            // Improved error handling for network addition
            const result = await addNetwork(chain)

            if (result.success) {
              // Try switching again after adding
              try {
                await window.ethereum!.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId }],
                })

                // Update current chain ID
                setCurrentChainId(chainId)
                setCurrentNetworkName(chain)

                setSelectedSourceChain(chain)
                setIsModalOpen(true)
              } catch (secondSwitchError: any) {
                // Handle user rejection of the switch request
                if (secondSwitchError.code === 4001) {
                  setError("Network switch was rejected")
                } else {
                  throw secondSwitchError
                }
              }
            } else {
              // Handle user rejection of adding the network
              if (result.rejected) {
                setError(`You declined to add the ${chain} network to your wallet`)
              } else {
                setError(`Failed to add ${chain} network to your wallet`)
              }
            }
          } catch (addError: any) {
            console.error("Error adding network:", addError)
            setError(`Failed to add ${chain} network: ${addError.message || "Network configuration error"}`)
          }
        } else if (switchError.code === 4001) {
          // User rejected the request to switch
          setError("Network switch was rejected")
        } else {
          throw switchError
        }
      }
    } catch (err: any) {
      console.error("Error switching network:", err)

      // Set a more specific error message
      setError(`Failed to switch to ${chain} network: ${err.message || "Unknown error"}`)
    }
  }

  // Update the processTransaction function to use the updated depositUSDC function
  const processTransaction = async (destinationAddress: string, selectedDestinationChain: string) => {
    setIsModalOpen(false)
    setTransactionStatus("loading")
    setErrorMessage(undefined)

    try {
      // Convert USDC amount to the correct format (6 decimals)
      // This exact amount will be transferred to the destination chain
      const usdcAmountInWei = (Number.parseFloat(usdcAmount) * 1000000).toString()

      // Get the current network name as the source chain
      const sourceChain = currentNetworkName

      if (!sourceChain) {
        throw new Error("Source chain not detected")
      }

      console.log("CCTP Transfer Details:", {
        sourceChain,
        destinationChain: selectedDestinationChain,
        amount: usdcAmountInWei,
        amountInUSDC: usdcAmount, // Original amount in USDC
        recipient: destinationAddress,
      })

      // Use the updated CCTP service to deposit USDC
      const result = await depositUSDC(
        sourceChain,
        selectedDestinationChain,
        usdcAmountInWei,
        destinationAddress,
        "PRIVATE_KEY_WOULD_COME_FROM_SECURE_SOURCE", // This should be handled securely
      )

      console.log("Transaction result:", result)

      // Store the transfer ID for later status checks
      if (result.transferId) {
        setTransferId(result.transferId)
      }

      setTransactionStatus("success")
      console.log(
        `Transaction successful: ${usdcAmount} USDC sent from ${sourceChain} and ${usdcAmount} USDC will be received on ${selectedDestinationChain}`,
      )

      // Reset any previous errors
      setError(null)
      setErrorMessage(undefined)
    } catch (err: any) {
      console.error("Transaction error:", err)

      // Set a more specific error message with details from the API if available
      let errorMsg = "Transaction failed"

      if (err.message) {
        errorMsg += `: ${err.message}`
        setErrorMessage(err.message)
      } else {
        errorMsg += ": Unknown error"
      }

      setError(errorMsg)
      setTransactionStatus("error")
    }
  }

  // Update the handleModalConfirm function to handle the selected destination chain
  const handleModalConfirm = (destinationAddress: string, selectedDestinationChain: string) => {
    setDestinationWallet(destinationAddress)
    setDestinationChain(selectedDestinationChain)
    processTransaction(destinationAddress, selectedDestinationChain)
  }

  const resetTransactionStatus = () => {
    setTransactionStatus(null)
  }

  // Add a useEffect to fetch gas cost data for the current network when connected
  useEffect(() => {
    if (isWalletConnected && currentNetworkName) {
      fetchGasCost(currentNetworkName)
    }
  }, [isWalletConnected, currentNetworkName])

  // Add this useEffect after the other useEffects but before the render function:
  useEffect(() => {
    if (apiData.length > 0) {
      // Fetch gas costs for all chains in apiData
      apiData.forEach((item) => {
        if (!gasCostData[item.chain.toLowerCase()]) {
          fetchGasCost(item.chain)
        }
      })
    }
  }, [apiData, gasCostData])

  // Calculate USD cost for a chain
  const calculateUsdCost = (chainName: string, ethPrice: number) => {
    const chainLower = chainName.toLowerCase()
    const gasData = gasCostData[chainLower]

    if (!gasData) return null

    const maxGasCostEth = Number.parseFloat(gasData.totalCostEIP1559Max)
    const usdCost = maxGasCostEth * ethPrice

    return {
      ethCost: maxGasCostEth,
      usdCost: usdCost,
      formattedUsd: usdCost.toFixed(6),
    }
  }

  // Render the current network status
  const renderCurrentNetworkStatus = () => {
    if (!isWalletConnected) return null

    if (apiData.length === 0) return null

    const isSupported = isCurrentNetworkSupported()
    const currentChainLower = currentNetworkName?.toLowerCase() || ""
    const gasData = gasCostData[currentChainLower]

    // Find the current chain in apiData to get its price
    const currentChainData = apiData.find((item) => item.chain.toLowerCase() === currentChainLower)
    const costCalculation =
      currentChainData && gasData ? calculateUsdCost(currentNetworkName!, currentChainData.price) : null

    return (
      <div
        className={`p-4 border ${isSupported ? "border-green-500" : "border-yellow-500"} mb-4 flex items-center gap-3`}
      >
        <div className="flex-shrink-0">
          {isSupported ? (
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          ) : (
            <Info className="w-5 h-5 text-yellow-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">
            {isSupported ? (
              <>
                Current network: <span className="font-bold">{currentNetworkName}</span>
              </>
            ) : (
              <>
                Current network: <span className="font-bold">{currentNetworkName || "Unknown"}</span> is not supported.
                Please select one of the networks below.
              </>
            )}
          </p>
        </div>
        {gasData && (
          <div className="mt-2 text-sm border-t border-gray-700 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                Gas Amount: <span className="font-mono">{gasData.gasAmount}</span>
              </div>
              <div>
                Gas Price:{" "}
                <span className="font-mono">{Number.parseFloat(gasData.gasPriceInEther).toFixed(12)} ETH</span>
              </div>
              <div>
                Max Fee: <span className="font-mono">{Number.parseFloat(gasData.maxFeeInEther).toFixed(12)} ETH</span>
              </div>
              <div>
                Priority Fee:{" "}
                <span className="font-mono">{Number.parseFloat(gasData.priorityFeeInEther).toFixed(12)} ETH</span>
              </div>
              <div>
                Legacy Cost:{" "}
                <span className="font-mono">{Number.parseFloat(gasData.totalCostLegacy).toFixed(8)} ETH</span>
              </div>
              <div>
                EIP1559 Cost:{" "}
                <span className="font-mono">
                  {Number.parseFloat(gasData.totalCostEIP1559Min).toFixed(8)} -{" "}
                  {Number.parseFloat(gasData.totalCostEIP1559Max).toFixed(8)} ETH
                </span>
              </div>

              {/* Add the USD cost calculation */}
              {costCalculation && (
                <div className="col-span-2 mt-1 pt-1 border-t border-gray-700">
                  <div className="font-semibold">Cost Calculation:</div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>Max Gas Cost (ETH):</div>
                    <div className="font-mono">{costCalculation.ethCost.toFixed(8)} ETH</div>
                    <div></div>

                    <div>ETH Price (USD):</div>
                    <div className="font-mono">${currentChainData!.price.toFixed(2)}</div>
                    <div></div>

                    <div className="font-semibold">Total Cost (USD):</div>
                    <div className="font-mono font-semibold">${costCalculation.formattedUsd}</div>
                    <div className="text-xs">
                      = {costCalculation.ethCost.toFixed(8)} × ${currentChainData!.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
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
          <div className="px-6 py-2">
            BadGuy
            {APP_MODE === "development" && (
              <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">TESTNET</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/addresses" className="text-white hover:underline">
            View Addresses
          </a>
          <a href="/contracts" className="text-white hover:underline">
            View Contracts
          </a>
          <a href="/debug" className="text-white hover:underline">
            Debug API
          </a>
          <a href="/api-test" className="text-white hover:underline">
            Test Price API
          </a>
          <MetaMaskConnector
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
            isConnected={isWalletConnected}
            walletAddress={walletAddress}
            onChainChanged={handleChainChanged}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex flex-col gap-6">
        <div className="flex gap-4 mt-24 mb-8">
          <div className="flex-1">
            <Input
              placeholder="input usdc"
              className="border border-white bg-black text-white h-16 text-center text-lg w-full"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              type="number"
              style={{ height: "64px" }} // Fixed height to match button
            />
          </div>
          <Button
            variant="outline"
            className="border border-white text-white hover:bg-white hover:text-black transition-colors min-w-[200px] h-16"
            onClick={fetchData}
            disabled={isLoading}
            style={{ height: "64px" }} // Fixed height to match input
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

        {error && <div className="text-red-500 text-center p-4 border border-red-500 bg-red-500/10">{error}</div>}

        {useFallbackData && (
          <div className="bg-yellow-500/20 border border-yellow-500 p-4 rounded-md mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="font-medium text-yellow-500">
                Using offline data. The API server is currently unavailable.
              </p>
            </div>
            <p className="text-sm mt-2 text-yellow-400">
              You can still explore the interface, but real-time pricing data is not available.
            </p>
          </div>
        )}

        {/* Option Cards - Only shown after data is fetched */}
        {apiData.length > 0 && (
          <div className="space-y-6">
            {!isWalletConnected && (
              <div className="text-center p-4 border border-white mb-4 bg-black text-white flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Please connect your wallet to select a network</span>
              </div>
            )}

            {/* Current Network Status */}
            {renderCurrentNetworkStatus()}

            {apiData.map((item, index) => {
              // Check if this chain is selected
              const isSelected = isChainSelected(item.chain)

              // Calculate USD cost if gas data is available
              const costCalculation = gasCostData[item.chain.toLowerCase()]
                ? calculateUsdCost(item.chain, item.price)
                : null

              // Update the chain card rendering in the apiData.map function to include validation
              return (
                <Card
                  key={index}
                  className={`border border-white bg-black p-4 ${isSelected ? "border-green-500 border-2" : ""}`}
                >
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="border border-white p-8 flex items-center justify-center w-24 h-24 flex-shrink-0">
                      {getChainLogo(item.chain)}
                    </div>

                    <div className="flex-1 border border-white p-4 flex flex-col items-center justify-center min-h-[80px] w-full">
                      <div className="font-bold">{item.chain}</div>
                      <div className="text-sm">
                        {formatNumber(item.price)} USD | Gas: {formatNumber(item.gasAmount, 6)} {item.gasUnit}
                      </div>
                      {costCalculation && (
                        <div className="text-xs mt-1">
                          <span className="font-semibold">Max Gas Cost:</span> ${costCalculation.formattedUsd} USD
                          <span className="text-xs ml-1 text-gray-400">
                            ({costCalculation.ethCost.toFixed(8)} × ${item.price.toFixed(2)})
                          </span>
                        </div>
                      )}
                      {costCalculation && isTotalCostExceedsInput(item.chain, item.price) && (
                        <div className="text-red-500 text-xs mt-2 p-1 border border-red-500 bg-red-500/10 w-full text-center">
                          Gas cost exceeds input USDC amount. Please increase your input.
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        className={`border border-white text-white hover:bg-white hover:text-black transition-colors min-w-[150px] ${
                          isSelected ? "bg-green-900 border-green-500" : ""
                        }`}
                        onClick={() => handleSelectChain(item.chain)}
                        disabled={transactionStatus === "loading" || !isWalletConnected}
                      >
                        {isSelected ? "Continue" : "Select"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Wallet Modal */}
        <WalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleModalConfirm}
          selectedChain={selectedSourceChain}
          availableChains={apiData}
        />

        {/* Transaction Status - update to include errorMessage */}
        <TransactionStatus status={transactionStatus} onClose={resetTransactionStatus} errorMessage={errorMessage} />

        {/* Transfer ID display (if available) */}
        {transferId && (
          <div className="mt-4 p-4 border border-white">
            <h3 className="font-bold mb-2">Transfer Details</h3>
            <p>Transfer ID: {transferId}</p>
            <p className="text-sm text-gray-400 mt-2">
              You can check the status of your transfer using the /cctp/status endpoint.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

