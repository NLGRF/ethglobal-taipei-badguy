"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface MetaMaskConnectorProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
  isConnected: boolean
  walletAddress: string
  onChainChanged?: (chainId: string) => void
}

export function MetaMaskConnector({
  onConnect,
  onDisconnect,
  isConnected,
  walletAddress,
  onChainChanged,
}: MetaMaskConnectorProps) {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask)
    }
  }, [])

  useEffect(() => {
    if (isMetaMaskInstalled && window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        console.log("Chain changed to:", chainId)
        if (onChainChanged) {
          onChainChanged(chainId)
        }
      }

      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("chainChanged", handleChainChanged)
        }
      }
    }
  }, [isMetaMaskInstalled, onChainChanged])

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      window.open("https://metamask.io/download/", "_blank")
      return
    }

    try {
      const accounts = await window.ethereum!.request({
        method: "eth_requestAccounts",
      })

      if (accounts && accounts.length > 0) {
        onConnect(accounts[0])
        console.log("Successfully connected to wallet:", accounts[0])
      } else {
        console.error("No accounts returned from MetaMask")
      }
    } catch (error: any) {
      if (error.code === 4001) {
        console.log("User rejected the connection request")
      } else {
        console.error("Failed to connect to MetaMask", error)
      }
    }
  }

  const disconnectWallet = () => {
    onDisconnect()
  }

  const shortenAddress = (address: string) => {
    return address.slice(0, 6) + "..." + address.slice(-4)
  }

  if (isConnected) {
    return (
      <Button
        variant="outline"
        className="border border-white text-white hover:bg-white hover:text-black transition-colors"
        onClick={disconnectWallet}
      >
        disconnect {shortenAddress(walletAddress)}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      className="border border-white text-white hover:bg-white hover:text-black transition-colors"
      onClick={connectWallet}
    >
      connect wallet
    </Button>
  )
} 