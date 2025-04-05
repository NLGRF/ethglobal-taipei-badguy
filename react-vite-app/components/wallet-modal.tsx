"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (destinationWallet: string, destinationChain: string) => void
  selectedChain: string
  availableChains: Array<{ chain: string; price: number }>
}

export function WalletModal({ isOpen, onClose, onConfirm, selectedChain, availableChains }: WalletModalProps) {
  const [destinationWallet, setDestinationWallet] = useState("")
  const [destinationChain, setDestinationChain] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Filter out the source chain and get available destination chains
  const destinationChains = availableChains
    .filter((item) => item.chain.toLowerCase() !== selectedChain.toLowerCase())
    .map((item) => item.chain)

  // Set the first available destination chain as default when modal opens
  useEffect(() => {
    if (isOpen && destinationChains.length > 0 && !destinationChain) {
      setDestinationChain(destinationChains[0])
    }
  }, [isOpen, destinationChains, destinationChain])

  const handleConfirm = () => {
    // Basic validation for Ethereum address
    if (!destinationWallet) {
      setError("Please enter a wallet address")
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(destinationWallet)) {
      setError("Please enter a valid wallet address")
      return
    }

    if (!destinationChain) {
      setError("Please select a destination chain")
      return
    }

    onConfirm(destinationWallet, destinationChain)
    setDestinationWallet("")
    setDestinationChain("")
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white p-6 rounded-none w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Enter Destination Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="mb-4">
            Source chain: <span className="font-bold">{selectedChain}</span>
          </p>

          <div className="space-y-4">
            {/* Destination Chain Dropdown */}
            <div className="space-y-2">
              <label htmlFor="destination-chain" className="block">
                Destination Chain
              </label>
              <Select value={destinationChain} onValueChange={setDestinationChain}>
                <SelectTrigger id="destination-chain" className="border border-white bg-black text-white w-full">
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-white text-white">
                  {destinationChains.map((chain) => (
                    <SelectItem key={chain} value={chain}>
                      {chain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wallet Address Input */}
            <div className="space-y-2">
              <label htmlFor="wallet-address" className="block">
                Destination Wallet Address
              </label>
              <Input
                id="wallet-address"
                placeholder="0x..."
                className="border border-white bg-black text-white"
                value={destinationWallet}
                onChange={(e) => {
                  setDestinationWallet(e.target.value)
                  setError(null)
                }}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border border-white text-white hover:bg-white hover:text-black"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-white text-black hover:bg-gray-200">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

