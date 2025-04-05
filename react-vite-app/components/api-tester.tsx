"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export function ApiTester() {
  const [apiUrl, setApiUrl] = useState("https://ethglobal-taipei-badguy.onrender.com")
  const [endpoint, setEndpoint] = useState("/price")
  const [amount, setAmount] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoTest, setAutoTest] = useState(true)

  // Auto-test on component mount if autoTest is true
  useEffect(() => {
    if (autoTest) {
      testEndpoint()
      setAutoTest(false)
    }
  }, [autoTest])

  const testEndpoint = async () => {
    setIsLoading(true)
    setResponse(null)
    setError(null)

    try {
      const fullUrl = `${apiUrl}${endpoint}?amount=${amount}`
      console.log(`Testing GET ${fullUrl}`)

      const res = await fetch(fullUrl)

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
        <CardTitle>API Price Endpoint Tester</CardTitle>
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
            className="border border-white bg-black text-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">
            Amount
          </label>
          <Input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-white bg-black text-white"
          />
        </div>

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

