"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { getDomainId, formatBytes32Address } from "@/services/cctp-service"

export function ApiDebug() {
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "")
  const [endpoint, setEndpoint] = useState("/cctp/transfer")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST">("POST")
  const [requestBody, setRequestBody] = useState("")
  const [sourceChain, setSourceChain] = useState("ethereum")
  const [destinationChain, setDestinationChain] = useState("base")
  const [amount, setAmount] = useState("1000000") // 1 USDC
  const [recipient, setRecipient] = useState("0x0000000000000000000000000000000000000000")

  // Generate request body based on form inputs
  useEffect(() => {
    const sourceDomainId = getDomainId(sourceChain)
    const destinationDomainId = getDomainId(destinationChain)
    const formattedRecipient = formatBytes32Address(recipient)

    const body = {
      sourceChain,
      destinationChain,
      amount,
      recipient,
      formattedRecipient,
      sourceDomainId,
      destinationDomainId,
      privateKey: "PRIVATE_KEY",
    }

    setRequestBody(JSON.stringify(body, null, 2))
  }, [sourceChain, destinationChain, amount, recipient])

  const testEndpoint = async () => {
    setIsLoading(true)
    setResponse(null)
    setError(null)

    try {
      const fullUrl = `${apiUrl}${endpoint}`
      console.log(`Testing ${requestMethod} ${fullUrl}`)

      const options: RequestInit = {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
        },
      }

      if (requestMethod === "POST") {
        options.body = requestBody
      }

      const res = await fetch(fullUrl, options)

      let responseData
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json()
      } else {
        responseData = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: responseData,
      })
    } catch (err: any) {
      console.error("Error testing endpoint:", err)
      setError(err.message || "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border border-white">
      <CardHeader>
        <CardTitle>CCTP API Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="api-url" className="text-sm font-medium">
            API Base URL
          </label>
          <Input
            id="api-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="border border-white bg-black text-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endpoint" className="text-sm font-medium">
            Endpoint Path
          </label>
          <Input
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/cctp/transfer"
            className="border border-white bg-black text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Request Method</label>
          <div className="flex gap-2">
            <Button
              variant={requestMethod === "GET" ? "default" : "outline"}
              onClick={() => setRequestMethod("GET")}
              className={requestMethod === "GET" ? "bg-white text-black" : ""}
            >
              GET
            </Button>
            <Button
              variant={requestMethod === "POST" ? "default" : "outline"}
              onClick={() => setRequestMethod("POST")}
              className={requestMethod === "POST" ? "bg-white text-black" : ""}
            >
              POST
            </Button>
          </div>
        </div>

        {requestMethod === "POST" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="source-chain" className="text-sm font-medium">
                  Source Chain
                </label>
                <select
                  id="source-chain"
                  value={sourceChain}
                  onChange={(e) => setSourceChain(e.target.value)}
                  className="w-full p-2 border border-white bg-black text-white rounded-md"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="linea">Linea</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="destination-chain" className="text-sm font-medium">
                  Destination Chain
                </label>
                <select
                  id="destination-chain"
                  value={destinationChain}
                  onChange={(e) => setDestinationChain(e.target.value)}
                  className="w-full p-2 border border-white bg-black text-white rounded-md"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="linea">Linea</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount (in USDC wei)
                </label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000000"
                  className="border border-white bg-black text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="recipient" className="text-sm font-medium">
                  Recipient Address
                </label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="border border-white bg-black text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="request-body" className="text-sm font-medium">
                Request Body (JSON)
              </label>
              <textarea
                id="request-body"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={10}
                className="w-full p-2 font-mono text-sm border border-white bg-black text-white rounded-md"
              />
            </div>
          </div>
        )}

        <Button onClick={testEndpoint} disabled={isLoading} className="bg-white text-black hover:bg-gray-200 w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Endpoint"
          )}
        </Button>

        {error && (
          <div className="p-4 border border-red-500 bg-red-900/20 rounded-md">
            <h3 className="font-bold text-red-400 mb-2">Error</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            <div className="p-4 border border-gray-700 rounded-md">
              <h3 className="font-bold mb-2">Response Status</h3>
              <div
                className={`text-sm ${response.status >= 200 && response.status < 300 ? "text-green-400" : "text-red-400"}`}
              >
                {response.status} {response.statusText}
              </div>
            </div>

            <div className="p-4 border border-gray-700 rounded-md">
              <h3 className="font-bold mb-2">Response Headers</h3>
              <pre className="text-xs font-mono bg-gray-900 p-2 rounded-md overflow-auto max-h-40">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </div>

            <div className="p-4 border border-gray-700 rounded-md">
              <h3 className="font-bold mb-2">Response Body</h3>
              <pre className="text-xs font-mono bg-gray-900 p-2 rounded-md overflow-auto max-h-80">
                {typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

