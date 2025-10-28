"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PositionCard } from "@/components/position-card"

import Link from "next/link"
import { usePushChainClient } from "@pushchain/ui-kit"

interface Position {
  id: string
  poolId: string
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
  liquidity: string
  minPrice: string
  maxPrice: string
  currentPrice: string
  inRange: boolean
  uncollectedFees0: string
  uncollectedFees1: string
  totalValue: string
  pnl: number
}

const MOCK_POSITIONS: Position[] = [
  {
    id: "1",
    poolId: "1",
    token0: { symbol: "ETH", name: "Ethereum", logoUrl: "/placeholder.svg?height=40&width=40" },
    token1: { symbol: "USDC", name: "USD Coin", logoUrl: "/placeholder.svg?height=40&width=40" },
    fee: 0.3,
    liquidity: "0.5 ETH + 1,225 USDC",
    minPrice: "2,200",
    maxPrice: "2,700",
    currentPrice: "2,450",
    inRange: true,
    uncollectedFees0: "0.0023",
    uncollectedFees1: "5.64",
    totalValue: "$2,450",
    pnl: 12.5,
  },
  {
    id: "2",
    poolId: "2",
    token0: { symbol: "WBTC", name: "Wrapped Bitcoin", logoUrl: "/placeholder.svg?height=40&width=40" },
    token1: { symbol: "ETH", name: "Ethereum", logoUrl: "/placeholder.svg?height=40&width=40" },
    fee: 0.3,
    liquidity: "0.05 WBTC + 0.8 ETH",
    minPrice: "15.5",
    maxPrice: "17.5",
    currentPrice: "18.2",
    inRange: false,
    uncollectedFees0: "0.00012",
    uncollectedFees1: "0.0019",
    totalValue: "$3,920",
    pnl: -3.2,
  },
  {
    id: "3",
    poolId: "3",
    token0: { symbol: "USDC", name: "USD Coin", logoUrl: "/placeholder.svg?height=40&width=40" },
    token1: { symbol: "USDT", name: "Tether USD", logoUrl: "/placeholder.svg?height=40&width=40" },
    fee: 0.01,
    liquidity: "5,000 USDC + 5,000 USDT",
    minPrice: "0.998",
    maxPrice: "1.002",
    currentPrice: "1.000",
    inRange: true,
    uncollectedFees0: "2.45",
    uncollectedFees1: "2.47",
    totalValue: "$10,000",
    pnl: 8.7,
  },
]

export default function PositionsPage() {
  const [positions] = useState<Position[]>(MOCK_POSITIONS)
  const { isInitialized: isConnected } = usePushChainClient()

  const totalValue = positions.reduce((sum, pos) => sum + Number.parseFloat(pos.totalValue.replace(/[$,]/g, "")), 0)
  const totalFees =
    positions.reduce(
      (sum, pos) =>
        sum +
        Number.parseFloat(pos.uncollectedFees0) * 2450 +
        Number.parseFloat(pos.uncollectedFees1.replace(/,/g, "")),
      0,
    ) || 0
  const activePositions = positions.filter((p) => p.inRange).length

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Your Positions
              </h1>
              <p className="text-muted-foreground text-lg">Manage your liquidity positions and collect fees</p>
            </div>
            <Link href="/pools">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Position
              </Button>
            </Link>
          </div>

          {/* Stats */}
          {isConnected && positions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="glass border-border/50 p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Value</div>
                <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              </Card>
              <Card className="glass border-border/50 p-4">
                <div className="text-sm text-muted-foreground mb-1">Uncollected Fees</div>
                <div className="text-2xl font-bold text-green-500">${totalFees.toFixed(2)}</div>
              </Card>
              <Card className="glass border-border/50 p-4">
                <div className="text-sm text-muted-foreground mb-1">Active Positions</div>
                <div className="text-2xl font-bold">
                  {activePositions} / {positions.length}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Positions List */}
        {!isConnected ? (
          <Card className="glass border-border/50 p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">Connect your wallet to view and manage your positions</p>
            </div>
          </Card>
        ) : positions.length === 0 ? (
          <Card className="glass border-border/50 p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-2">No Positions Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first liquidity position to start earning fees from trades
              </p>
              <Link href="/pools">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Position
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
