"use client"

import { use, useState } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface PoolDetailPageProps {
  params: Promise<{ id: string }>
}

export default function PoolDetailPage({ params }: PoolDetailPageProps) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("overview")

  // Mock pool data - in real app, fetch from contract
  const pool = {
    id,
    token0: { symbol: "ETH", name: "Ethereum", logoUrl: "/placeholder.svg?height=48&width=48" },
    token1: { symbol: "USDC", name: "USD Coin", logoUrl: "/placeholder.svg?height=48&width=48" },
    fee: 0.3,
    tvl: "$245.2M",
    volume24h: "$89.4M",
    volume7d: "$624.8M",
    fees24h: "$268.2K",
    apr: "24.5%",
    priceChange24h: 2.34,
    currentPrice: "2,450.32",
    liquidity: "100,234.56",
  }

  const isPositive = pool.priceChange24h >= 0

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link href="/pools">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pools
          </Button>
        </Link>

        {/* Pool Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center -space-x-3">
                <Image
                  src={pool.token0.logoUrl || "/placeholder.svg"}
                  alt={pool.token0.symbol}
                  width={48}
                  height={48}
                  className="rounded-full border-4 border-card"
                />
                <Image
                  src={pool.token1.logoUrl || "/placeholder.svg"}
                  alt={pool.token1.symbol}
                  width={48}
                  height={48}
                  className="rounded-full border-4 border-card"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {pool.token0.symbol}/{pool.token1.symbol}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{pool.fee}% Fee Tier</span>
                  <span>•</span>
                  <span>Pool #{pool.id}</span>
                </div>
              </div>
            </div>
            <Link href={`/pools/${id}/add`}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Add Liquidity
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Value Locked</div>
              <div className="text-2xl font-bold">{pool.tvl}</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
              <div className="text-2xl font-bold">{pool.volume24h}</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">24h Fees</div>
              <div className="text-2xl font-bold text-green-500">{pool.fees24h}</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">APR</div>
              <div className="text-2xl font-bold text-green-500">{pool.apr}</div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Price Info */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Pool Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                  <div className="text-xl font-semibold">
                    1 {pool.token0.symbol} = {pool.currentPrice} {pool.token1.symbol}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm mt-1",
                      isPositive ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(pool.priceChange24h)}% (24h)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Liquidity</div>
                  <div className="text-xl font-semibold">{pool.liquidity} LP Tokens</div>
                </div>
              </div>
            </Card>

            {/* Token Addresses */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Token Addresses</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={pool.token0.logoUrl || "/placeholder.svg"}
                      alt={pool.token0.symbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="font-medium">{pool.token0.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground">0x0000...0000</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={pool.token1.logoUrl || "/placeholder.svg"}
                      alt={pool.token1.symbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="font-medium">{pool.token1.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground">0xa0b8...eb48</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="glass border-border/50 p-6">
              <p className="text-center text-muted-foreground">Recent transactions will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
