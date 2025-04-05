'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createPublicClient, http, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GasPrice {
  chain: string
  gasName: string
  price: number
  gasUnit: string
  gasAmount: number
  usdcPrice: number
}

interface GasCost {
  success: boolean
  data: {
    gasAmount: string
    gasPriceInEther: string
    maxFeeInEther: string
    priorityFeeInEther: string
    totalCostLegacy: string
    totalCostEIP1559Min: string
    totalCostEIP1559Max: string
  }
}

// USDC Token addresses (testnet)
const USDC_ADDRESS: { [key: string]: `0x${string}` } = {
  "0xaa36a7": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // Sepolia USDC
}

// USDC ABI for balanceOf
const USDC_ABI = [{
  constant: true,
  inputs: [{ name: "_owner", type: "address" }],
  name: "balanceOf",
  outputs: [{ name: "balance", type: "uint256" }],
  payable: false,
  stateMutability: "view",
  type: "function",
}] as const

export default function BuyGasPage() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [chainId, setChainId] = useState('')
  const [chainName, setChainName] = useState('')
  const [ethBalance, setEthBalance] = useState('0')
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [usdcAmount, setUsdcAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([])
  const [selectedChain, setSelectedChain] = useState<string>('')
  const [gasCost, setGasCost] = useState<GasCost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [destinationAddress, setDestinationAddress] = useState('')
  const [selectedGasOption, setSelectedGasOption] = useState<GasPrice | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const getChainName = (chainId: string) => {
    console.log('Getting chain name for:', chainId)
    
    const chains: { [key: string]: string } = {
      // Chain IDs
      "43113": "Ethereum Sepolia",
      "84532": "Base Sepolia",
      "0xaa36a7": "Ethereum Sepolia",
      "0x14a34": "Base Sepolia",
      // Chain Names
      "Ethereum": "Ethereum Sepolia",
      "Base": "Base Sepolia",
      "Polygon": "Polygon Amoy",
      "Celo": "Celo",
      "Rootstock": "Rootstock Testnet"
    }

    // Log available chains
    console.log('Available chains:', chains)
    
    // Try to get chain name directly
    const chainName = chains[chainId] || chainId.replace('0x', '')
    console.log('Found chain name:', chainName)
    return chainName
  }

  const handleNetworkChange = async () => {
    if (!window.ethereum) return
    try {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
      console.log('Network changed to chainId:', chainIdHex)
      setChainId(chainIdHex)
      setChainName(getChainName(chainIdHex))
      return chainIdHex // Return chainId for immediate use
    } catch (error) {
      console.error('Error getting chainId:', error)
    }
  }

  const fetchBalances = async (currentChainId: string) => {
    if (!isWalletConnected || !window.ethereum || !currentChainId) return

    try {
      // Create public client
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      })

      // Get ETH balance
      const ethBal = await publicClient.getBalance({
        address: walletAddress as `0x${string}`
      })
      setEthBalance(formatUnits(ethBal, 18))

      // Get USDC balance if on supported network
      console.log('Current chainId:', currentChainId)
      console.log('Supported chains:', Object.keys(USDC_ADDRESS))
      console.log('Is chain supported:', !!USDC_ADDRESS[currentChainId])

      if (USDC_ADDRESS[currentChainId]) {
        try {
          console.log('Chain ID:', currentChainId)
          console.log('USDC Contract Address:', USDC_ADDRESS[currentChainId])
          console.log('Wallet Address:', walletAddress)

          const balance = await publicClient.readContract({
            address: USDC_ADDRESS[currentChainId],
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`]
          })

          console.log('USDC raw balance:', balance.toString())
          const formattedBalance = formatUnits(balance, 6)
          console.log('USDC formatted balance:', formattedBalance)
          
          setUsdcBalance(formattedBalance)
        } catch (error) {
          console.error('Error fetching USDC balance:', error)
          setUsdcBalance('0')
        }
      } else {
        console.log('No USDC contract address for chain:', currentChainId)
        setUsdcBalance('0')
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  useEffect(() => {
    const setup = async () => {
      if (window.ethereum) {
        const currentChainId = await handleNetworkChange()
        if (isWalletConnected && currentChainId) {
          fetchBalances(currentChainId)
        }
      }
    }
    setup()
  }, []) // Run once on mount

  // Handle wallet connection changes
  useEffect(() => {
    if (isWalletConnected) {
      handleNetworkChange().then(currentChainId => {
        if (currentChainId) {
          fetchBalances(currentChainId)
        }
      })

      // Setup network change listener
      const onChainChanged = async () => {
        const newChainId = await handleNetworkChange()
        if (newChainId) {
          fetchBalances(newChainId)
        }
      }

      window.ethereum?.on('chainChanged', onChainChanged)

      return () => {
        window.ethereum?.removeListener('chainChanged', onChainChanged)
      }
    }
  }, [isWalletConnected, walletAddress])

  const handleConnectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setWalletAddress(accounts[0])
        setIsWalletConnected(true)
      } else {
        alert('Please install MetaMask!')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const handleDisconnectWallet = () => {
    setWalletAddress('')
    setIsWalletConnected(false)
    setChainId('')
    setChainName('')
    setEthBalance('0')
    setUsdcBalance('0')
  }

  const handleConfirm = async () => {
    if (!usdcAmount || isNaN(Number(usdcAmount))) {
      setError('Please enter a valid amount')
      return
    }

    if (Number(usdcAmount) > Number(usdcBalance)) {
      setError('Insufficient USDC balance')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`https://ethglobal-taipei-badguy.onrender.com/price?amount=${usdcAmount}`)
      const data = await response.json()
      console.log('API Response:', data)
      setGasPrices(data)
      
      const gasCostResponse = await fetch('https://pump-apis.onrender.com/gas/cost/ethereum')
      const gasCostData = await gasCostResponse.json()
      setGasCost(gasCostData)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = (price: GasPrice) => {
    const minUsdcRequired = Number(gasCost?.data.totalCostEIP1559Max) * price.price
    const isAmountSufficient = Number(usdcAmount) >= minUsdcRequired
    
    if (isAmountSufficient) {
      setSelectedGasOption(price)
      setIsModalOpen(true)
    }
  }

  const handleSendGas = async () => {
    try {
      if (!selectedGasOption) throw new Error("No gas option selected")
      if (!destinationAddress) throw new Error("No destination address")
      if (!usdcAmount) throw new Error("No USDC amount")

      // Convert chain IDs to numbers correctly
      const sourceChainId = chainId.startsWith('0x') ? parseInt(chainId.slice(2), 16) : parseInt(chainId)
      const destChainId = selectedGasOption.chain.startsWith('0x') 
        ? parseInt(selectedGasOption.chain.slice(2), 16) 
        : parseInt(selectedGasOption.chain)

      console.log('Sending gas with params:', {
        sourceChainId,
        destChainId,
        usdcAmount,
        destinationAddress,
        speed: "fast"
      })

      await executeTransfer(
        sourceChainId,
        destChainId,
        usdcAmount,
        destinationAddress,
        "fast"
      )
      
      console.log('Transfer completed, current step:', currentStep)
      console.log('Transfer logs:', logs)
      if (transferError) {
        console.error('Transfer error:', transferError)
        throw new Error(transferError)
      }
      
      setIsSuccess(true)
      setIsModalOpen(false)
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false)
        setDestinationAddress('')
        setSelectedGasOption(null)
        setUsdcAmount('')
      }, 3000)
    } catch (err) {
      console.error('Error sending gas:', err)
      setError(err instanceof Error ? err.message : 'Failed to send gas')
    }
  }

        return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Buy Gas (Native Token)</h1>
        <div className="bg-black border border-gray-800 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Purchase Configuration</h2>
            <Button 
              variant={isWalletConnected ? "outline" : "default"}
              onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}
              className={isWalletConnected ? "bg-transparent text-white border-white hover:bg-white hover:text-black" : ""}
            >
              {isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
              </Button>
            </div>
          {isWalletConnected && (
            <>
              <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-white">Connected to wallet</span>
                  <span className="ml-auto text-gray-400 text-sm">{walletAddress}</span>
                  </div>
                  </div>
              <div className="space-y-4 text-white">
                <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                  <span>Chain ID:</span>
                  <span className="text-gray-400">{chainId}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                  <span>Network:</span>
                  <span className="text-gray-400">{chainName}</span>
              </div>
                <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                  <span>ETH Balance:</span>
                  <span className="text-gray-400">{Number(ethBalance).toFixed(6)} ETH</span>
              </div>
                <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                  <span>USDC Balance:</span>
                  <span className="text-gray-400">{Number(usdcBalance).toFixed(2)} USDC</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="usdcAmount" className="text-sm text-gray-400">
                      USDC Amount
                    </label>
                    <div className="flex gap-2">
                <Input
                        id="usdcAmount"
                        type="number"
                        placeholder="Enter USDC amount"
                  value={usdcAmount}
                  onChange={(e) => setUsdcAmount(e.target.value)}
                        className="bg-gray-900/50 border-gray-700 text-white"
                        min="0"
                        step="0.01"
                />
              <Button
                        onClick={handleConfirm}
                        disabled={!usdcAmount || isLoading || Number(usdcAmount) <= 0 || Number(usdcAmount) > Number(usdcBalance)}
                        className="min-w-[100px]"
                      >
                        {isLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
                    {error && (
                      <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                  </div>
                  </div>
                </div>
            </>
          )}
                            </div>

        {gasPrices.length > 0 && gasCost && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Available Gas Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gasPrices.map((price) => {
                  const minUsdcRequired = Number(gasCost.data.totalCostEIP1559Max) * price.price;
                  const isAmountSufficient = Number(usdcAmount) >= minUsdcRequired;
                  const isSameChain = getChainName(chainId) === getChainName(price.chain);

                      return (
                    <div 
                      key={`${price.chain}-${price.gasName}`}
                      className={`bg-black border rounded-2xl p-6 transition-all ${
                        isSameChain 
                          ? 'border-gray-500 bg-gray-900/20 cursor-not-allowed opacity-50'
                          : isAmountSufficient
                            ? 'border-green-500 bg-green-900/20 cursor-pointer hover:bg-green-900/30'
                            : 'border-red-500 bg-red-900/20 cursor-not-allowed'
                      }`}
                          onClick={() => {
                        if (!isSameChain && isAmountSufficient) {
                          handleCardClick(price)
                        }
                      }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">{getChainName(price.chain)}</h3>
                        <span className="text-gray-400">{price.gasName}</span>
                            </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-white">{price.price.toFixed(2)} USDC</span>
                              </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gas Amount:</span>
                          <span className="text-white">{price.gasAmount.toFixed(6)}</span>
                              </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">USDC Price:</span>
                          <span className="text-white">{price.usdcPrice.toFixed(2)} USDC</span>
                            </div>
                        {gasCost && (
                          <>
                            <div className="border-t border-gray-700 my-2"></div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Minimum USDC Required:</span>
                              <span className={`${
                                isSameChain 
                                  ? 'text-gray-500'
                                  : isAmountSufficient 
                                    ? 'text-green-500' 
                                    : 'text-red-500'
                              }`}>
                                {minUsdcRequired.toFixed(2)} USDC
                              </span>
                            </div>
                            {isSameChain && (
                              <div className="text-gray-500 text-sm mt-2">
                                Cannot send gas to the same chain
                  </div>
                )}
                          </>
                        )}
                      </div>
                      </div>
                  );
                })}
                    </div>
                  </div>
                )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-black border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Send Gas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
                    <div className="space-y-2">
              <label className="text-sm text-gray-400">Source Chain</label>
              <div className="p-2 bg-gray-900/50 rounded-lg text-white">
                {getChainName(chainId)}
                      </div>
                      </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Destination Chain</label>
              <div className="p-2 bg-gray-900/50 rounded-lg text-white">
                {selectedGasOption ? getChainName(selectedGasOption.chain) : 'Unknown Network'}
                    </div>
            </div>
                    <div className="space-y-2">
              <label className="text-sm text-gray-400">Destination Address</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter destination address"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
                <Button
                  onClick={() => setDestinationAddress(walletAddress)}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  Use My Address
                </Button>
                      </div>
                        </div>
            <div className="flex justify-end gap-2">
            <Button
              variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Cancel
            </Button>
            <Button
                onClick={handleSendGas}
                className="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                  !selectedGasOption || 
                  !destinationAddress || 
                !usdcAmount ||
                  getChainName(chainId) === getChainName(selectedGasOption.chain)
                }
              >
                {selectedGasOption && getChainName(chainId) === getChainName(selectedGasOption.chain)
                  ? 'Cannot send to same chain'
                  : 'Send Gas'
                }
            </Button>
                    </div>
                    </div>
        </DialogContent>
      </Dialog>

      {isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-white">Gas sent successfully!</span>
                      </div>
                    </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-white">{error}</span>
                      </div>
                    </div>
                  )}

      {logs.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-gray-900/20 border border-gray-500/50 rounded-lg p-4 max-h-96 overflow-y-auto w-96">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="text-white text-sm">
                        {log}
                      </div>
            ))}
                </div>
        </div>
      )}
    </div>
  )
}
