import { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: any
  }
}

interface Chain {
  name: string
  chainId: number
  rpcUrl: string
  testnet: boolean
  currencySymbol: string
  blockExplorerUrl: string
}

const ALL_CHAINS: Chain[] = [
  {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    testnet: false,
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io'
  },
  {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    testnet: false,
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://basescan.org'
  },
  {
    name: 'Linea',
    chainId: 59144,
    rpcUrl: 'https://linea-mainnet.infura.io/v3/',
    testnet: false,
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://lineascan.build'
  },
  {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    testnet: true,
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io'
  },
  {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    testnet: true,
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.basescan.org'
  },
  {
    name: 'Linea Sepolia',
    chainId: 59141,
    rpcUrl: 'https://rpc.sepolia.linea.build',
    testnet: true,
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.lineascan.build'
  }
]

export const SUPPORTED_CHAINS = import.meta.env.VITE_APP_MODE === 'development'
  ? ALL_CHAINS.filter(chain => chain.testnet)
  : ALL_CHAINS.filter(chain => !chain.testnet)

interface WalletContextType {
  address: string | null
  chain: Chain | null
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

const WalletContext = createContext<WalletContextType | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chain, setChain] = useState<Chain | null>(null)

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const network = await provider.getNetwork()
      const currentChain = SUPPORTED_CHAINS.find(c => c.chainId === Number(network.chainId))
      setAddress(accounts[0])
      setChain(currentChain || null)
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setChain(null)
  }

  const switchChain = async (chainId: number) => {
    if (!window.ethereum) return

    const targetChain = SUPPORTED_CHAINS.find(c => c.chainId === chainId)
    if (!targetChain) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const currentChain = SUPPORTED_CHAINS.find(c => c.chainId === Number(network.chainId))
      setChain(currentChain || null)
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: targetChain.name,
              rpcUrls: [targetChain.rpcUrl],
              nativeCurrency: {
                name: targetChain.currencySymbol,
                symbol: targetChain.currencySymbol,
                decimals: 18
              },
              blockExplorerUrls: [targetChain.blockExplorerUrl]
            }]
          })
        } catch (addError) {
          console.error('Error adding chain:', addError)
        }
      }
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.send('eth_accounts', [])
          const network = await provider.getNetwork()
          const currentChain = SUPPORTED_CHAINS.find(c => c.chainId === Number(network.chainId))
          
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setChain(currentChain || null)
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }

    checkConnection()

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || null)
        if (!accounts[0]) {
          setChain(null)
        }
      })
      window.ethereum.on('chainChanged', async () => {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        const currentChain = SUPPORTED_CHAINS.find(c => c.chainId === Number(network.chainId))
        setChain(currentChain || null)
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [])

  return (
    <WalletContext.Provider value={{ address, chain, connect, disconnect, switchChain }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
} 