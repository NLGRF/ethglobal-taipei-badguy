"use client"

import { ContractOverview } from "@/components/contract-overview"

export default function ContractsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">CCTP Contract Overview</h1>
      <ContractOverview />
    </div>
  )
}

