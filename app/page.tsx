"use client"

import { Suspense } from "react"
import { SwapInterface } from "@/components/swap-interface"
import { usePushChainClient } from "@pushchain/ui-kit";

function SwapContent() {
  const {  isInitialized : isConnected, error } = usePushChainClient();

  if (error) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
            <p className="font-semibold">Connection Error</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Universal Token Swaps
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Trade tokens across any blockchain with Uniswap V3 on Push Chain
          </p>
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-600">
            <p className="font-semibold">Please connect your wallet to continue</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Universal Token Swaps
          </h1>
          <p className="text-muted-foreground text-lg">
            Trade tokens across any blockchain with Uniswap V3 on Push Chain
          </p>
        </div>

        {/* Swap Interface */}
        <SwapInterface />

        {/* Info Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-pink-500 mb-1">0.3%</div>
            <div className="text-sm text-muted-foreground">Trading Fee</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-500 mb-1">$2.4B</div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-pink-500 mb-1">150+</div>
            <div className="text-sm text-muted-foreground">Token Pairs</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <SwapContent />
    </Suspense>
  )
}
