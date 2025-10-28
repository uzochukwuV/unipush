"use client"

import { use, useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePools, type PoolData } from "@/hooks/use-pools"
import { usePushChainClient } from "@pushchain/ui-kit"

interface PoolDetailPageProps {
  params: Promise<{ id: string }>
}

export default function PoolDetailPage({ params }: PoolDetailPageProps) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("overview")
  const { isInitialized: isConnected } = usePushChainClient()
  const { getPoolByID } = usePools()
  const [pool, setPool] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pool data from blockchain
  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        setLoading(true)
        setError(null)

        // The id is the pool address (0x...)
        // We need to parse it to get token0, token1, and fee
        // For now, we'll use the pool address directly
        console.log(`[PoolDetailPage] Loading pool data for address: ${id}`)

        // Since we have the pool address, we can fetch its state directly
        // using a modified version of getPoolState
        // For this, let's query the pool contract directly

        if (isConnected) {
          // Try to fetch the pool using the address
          const poolData = await getPoolByID(id)

          if (poolData) {
            setPool(poolData)
          } else {
            setError("Pool not found")
          }
        }
      } catch (err: any) {
        console.error("[PoolDetailPage] Error fetching pool:", err)
        setError(err.message || "Failed to fetch pool data")
      } finally {
        setLoading(false)
      }
    }

    fetchPoolData()
  }, [id, isConnected, getPoolByID])

  const isPositive = true // Placeholder for price change

  if (loading) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <Link href="/pools">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
          <Card className="glass border-border/50 p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Loading Pool Data</h3>
              <p className="text-muted-foreground">Fetching pool information from the blockchain...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !pool) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <Link href="/pools">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
          <Card className="glass border-border/50 p-12 text-center border-red-500/20 bg-red-500/5">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-2 text-red-500">Error Loading Pool</h3>
              <p className="text-muted-foreground mb-6">{error || "Pool not found"}</p>
              <Link href="/pools">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  Back to Pools
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate liquidity in readable format
  const liquidityNum = parseFloat(pool.liquidity) / 1e18
  const liquidityFormatted =
    liquidityNum > 1000000 ? `${(liquidityNum / 1000000).toFixed(2)}M` : `${liquidityNum.toFixed(2)}`

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
                  <span>{pool.feePercentage} Fee Tier</span>
                  <span>•</span>
                  <span>Pool Address: {pool.address.slice(0, 6)}...{pool.address.slice(-4)}</span>
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
              <div className="text-sm text-muted-foreground mb-1">Total Liquidity</div>
              <div className="text-2xl font-bold">{liquidityFormatted} LP</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Current Tick</div>
              <div className="text-2xl font-bold">{pool.tick}</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Price (sqrtX96)</div>
              <div className="text-2xl font-bold text-blue-500">{(BigInt(pool.sqrtPriceX96) / BigInt(1e15)).toString()}</div>
            </Card>
            <Card className="glass border-border/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Fee Tier</div>
              <div className="text-2xl font-bold text-green-500">{pool.feePercentage}</div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Pool Information */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Pool Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Pool Address</div>
                  <div className="text-xl font-semibold font-mono text-sm break-all">
                    {pool.address}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Tick</div>
                  <div className="text-xl font-semibold">{pool.tick}</div>
                </div>
              </div>
            </Card>

            {/* Token Addresses */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Token Information</h3>
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
                    <div>
                      <span className="font-medium block">{pool.token0.symbol}</span>
                      <span className="text-xs text-muted-foreground">{pool.token0.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      {pool.token0.address.slice(0, 10)}...
                    </code>
                    <a
                      href={`https://explorer.pushprotocol.io/address/${pool.token0.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
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
                    <div>
                      <span className="font-medium block">{pool.token1.symbol}</span>
                      <span className="text-xs text-muted-foreground">{pool.token1.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      {pool.token1.address.slice(0, 10)}...
                    </code>
                    <a
                      href={`https://explorer.pushprotocol.io/address/${pool.token1.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">On-Chain Data</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">sqrtPriceX96:</span>
                  <span className="font-semibold break-all">{pool.sqrtPriceX96}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Liquidity:</span>
                  <span className="font-semibold">{pool.liquidity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tick:</span>
                  <span className="font-semibold">{pool.tick}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee:</span>
                  <span className="font-semibold">{pool.fee} bps ({pool.feePercentage})</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
