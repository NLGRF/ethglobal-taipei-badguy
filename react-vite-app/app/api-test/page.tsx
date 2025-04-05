"use client"

import { ApiTester } from "@/components/api-tester"

export default function ApiTestPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">API Price Endpoint Test</h1>
      <ApiTester />
    </div>
  )
}

