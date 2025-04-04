"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (destinationWallet: string) => void
  selectedChain: string
}

export function WalletModal({ isOpen, onClose, onConfirm, selectedChain }: WalletModalProps) {
  const [destinationWallet, setDestinationWallet] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (!destinationWallet) {
      setError("Please enter a wallet address")
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(destinationWallet)) {
      setError("Please enter a valid wallet address")
      return
    }

    onConfirm(destinationWallet)
    setDestinationWallet("")
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white p-6 rounded-none w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Enter Destination Wallet</h2>
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
            Selected chain: <span className="font-bold">{selectedChain}</span>
          </p>
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