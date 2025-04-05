"use client"

import { AddressViewer } from "@/components/address-viewer"

export default function AddressesPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Contract Addresses</h1>
      <AddressViewer />
    </div>
  )
}

