"use client"

import { ApiDebug } from "@/components/api-debug"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">API Debug Tool</h1>
      <ApiDebug />
    </div>
  )
}

