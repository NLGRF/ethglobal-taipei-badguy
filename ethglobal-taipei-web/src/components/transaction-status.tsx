"use client"

import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface TransactionStatusProps {
  status: "loading" | "success" | "error" | null
  onClose: () => void
}

export function TransactionStatus({ status, onClose }: TransactionStatusProps) {
  if (!status) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white p-6 rounded-none w-full max-w-md">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 animate-spin mb-4" />
            <h2 className="text-xl font-bold mb-2">Processing Transaction</h2>
            <p className="text-center text-muted-foreground">
              Please wait while we process your transaction. This may take a moment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction Successful</h2>
            <p className="text-center text-muted-foreground mb-6">Your transaction has been processed successfully.</p>
            <Button onClick={onClose} className="bg-white text-black hover:bg-gray-200">
              Close
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction Failed</h2>
            <p className="text-center text-muted-foreground mb-6">
              There was an error processing your transaction. Please try again or contact support if the issue persists.
            </p>
            <Button onClick={onClose} className="bg-white text-black hover:bg-gray-200">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 