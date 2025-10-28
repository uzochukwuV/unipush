"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CreatePoolDialog } from "@/components/create-pool-dialog"
import { PoolCard } from "@/components/pool-card"
import { usePools, PoolData } from "@/hooks/use-pools"

interface Pool {
  id: string
  token0: {
    symbol: string
    name: string
    logoUrl: string
  }
  token1: {
    symbol: string
    name: string
    logoUrl: string
  }
  fee: number
  tvl: string
  volume24h: string
  volume7d: string
  apr: string
  priceChange24h: number
}

/**
 * Transform PoolData from hook into Pool format for PoolCard
 * Note: TVL, volume, and APR data comes from on-chain liquidity
 * For production, these would be calculated from historical data and The Graph
 */
function transformPoolData(poolData: PoolData): Pool {
  // Calculate rough TVL estimate from liquidity
  // In production, multiply by token prices for accurate TVL
  const liquidityNum = parseFloat(poolData.liquidity) || 0
  const estimatedTVL = (liquidityNum / 1e18) * 100 // Rough estimate

  return {
    id: poolData.address,
    token0: {
      symbol: poolData.token0.symbol,
      name: poolData.token0.name,
      logoUrl: poolData.token0.logoUrl || "/placeholder.svg?height=40&width=40",
    },
    token1: {
      symbol: poolData.token1.symbol,
      name: poolData.token1.name,
      logoUrl: poolData.token1.logoUrl || "/placeholder.svg?height=40&width=40",
    },
    fee: poolData.fee / 10000, // Convert to percentage (3000 -> 0.3)
    tvl: estimatedTVL > 1000000 ? `$${(estimatedTVL / 1000000).toFixed(1)}M` : `$${(estimatedTVL / 1000).toFixed(1)}K`,
    volume24h: "$0", // Would need The Graph or block explorer
    volume7d: "$0", // Would need historical data
    apr: "N/A", // Would need to calculate from fees over time
    priceChange24h: 0, // Would need historical price data
  }
}

export default function PoolsPage() {
  const [search, setSearch] = useState("")
  const [showCreatePool, setShowCreatePool] = useState(false)
  const { getAllPools, pools, loading, error } = usePools()
  const [displayPools, setDisplayPools] = useState<Pool[]>([])

  // Fetch all pools on component mount
  useEffect(() => {
    getAllPools()
  }, [getAllPools])

  // Transform fetched pools to display format
  useEffect(() => {
    if (pools && pools.length > 0) {
      const transformedPools = pools.map(transformPoolData)
      setDisplayPools(transformedPools)
    }
  }, [pools])

  // Filter pools based on search
  const filteredPools = displayPools.filter(
    (pool) =>
      pool.token0.symbol.toLowerCase().includes(search.toLowerCase()) ||
      pool.token1.symbol.toLowerCase().includes(search.toLowerCase()) ||
      pool.token0.name.toLowerCase().includes(search.toLowerCase()) ||
      pool.token1.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Calculate aggregate stats from real pools
  const totalLiquidity = pools.reduce((sum, pool) => {
    try {
      const liquidity = BigInt(pool.liquidity) || BigInt(0)
      return sum + liquidity
    } catch {
      return sum
    }
  }, BigInt(0))

  const totalPoolsCount = pools.length
  const totalLiquidityValue =
    totalLiquidity > BigInt(1000000000000000000)
      ? `$${(Number(totalLiquidity) / 1e24).toFixed(2)}M`
      : `$${(Number(totalLiquidity) / 1e18).toFixed(2)}K`

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Liquidity Pools
              </h1>
              <p className="text-muted-foreground text-lg">Provide liquidity and earn fees from trades</p>
            </div>
            <Button
              onClick={() => setShowCreatePool(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Pool
            </Button>
          </div>

          {/* Stats - Dynamic from real pool data */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Value Locked</div>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                ) : (
                  totalLiquidityValue
                )}
              </div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
              <div className="text-2xl font-bold text-muted-foreground">$0</div>
              <div className="text-xs text-muted-foreground mt-1">Requires The Graph</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">7d Volume</div>
              <div className="text-2xl font-bold text-muted-foreground">$0</div>
              <div className="text-xs text-muted-foreground mt-1">Requires historical data</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Pools</div>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-12 animate-pulse bg-muted rounded" />
                ) : (
                  totalPoolsCount
                )}
              </div>
            </Card>
          </div>

          {/* Error State */}
          {error && (
            <Card className="glass border-red-500/50 bg-red-500/5 p-4 mb-6">
              <p className="text-sm text-red-500">
                <span className="font-semibold">Error loading pools:</span> {error}
              </p>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pools by token name or symbol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-12 bg-secondary/50"
            />
          </div>
        </div>

        {/* Pool List */}
        <div className="space-y-4">
          {loading && (
            <Card className="glass border-border/50 p-12 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader className="h-5 w-5 animate-spin text-pink-500" />
                <p className="text-muted-foreground">Loading pools...</p>
              </div>
            </Card>
          )}

          {!loading && displayPools.length === 0 && (
            <Card className="glass border-border/50 p-12 text-center">
              <p className="text-muted-foreground">No pools found. Create the first one!</p>
            </Card>
          )}

          {filteredPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}

          {!loading && filteredPools.length === 0 && displayPools.length > 0 && (
            <Card className="glass border-border/50 p-12 text-center">
              <p className="text-muted-foreground">No pools found matching your search</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Pool Dialog */}
      <CreatePoolDialog open={showCreatePool} onOpenChange={setShowCreatePool} />
    </div>
  )
}
