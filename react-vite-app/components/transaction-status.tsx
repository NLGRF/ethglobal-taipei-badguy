"use client"

import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface TransactionStatusProps {
  status: "loading" | "success" | "error" | null
  onClose: () => void
  errorMessage?: string
}

export function TransactionStatus({ status, onClose, errorMessage }: TransactionStatusProps) {
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
            <p className="text-center text-muted-foreground mb-2">Your transaction has been processed successfully.</p>
            <p className="text-center text-muted-foreground mb-6">
              The exact amount of USDC will be received on the destination chain (1:1 ratio).
            </p>
            <Button onClick={onClose} className="bg-white text-black hover:bg-gray-200">
              Close
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction Failed</h2>
            <p className="text-center text-muted-foreground mb-4">There was an error processing your transaction.</p>
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-900/20 border border-red-500 rounded w-full max-w-sm overflow-auto">
                <p className="text-sm text-red-400 font-mono break-all">{errorMessage}</p>
                {errorMessage.includes("404") && (
                  <div className="mt-2 pt-2 border-t border-red-800">
                    <p className="text-xs text-red-300">API endpoint not found. This may be due to:</p>
                    <ul className="text-xs text-red-300 list-disc pl-4 mt-1">
                      <li>The API server is not running</li>
                      <li>The API endpoint path has changed</li>
                      <li>The API URL is incorrect</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            <p className="text-center text-muted-foreground mb-6">
              Please try again or contact support if the issue persists.
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

