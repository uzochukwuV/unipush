"use client"

import { useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PositionCard } from "@/components/position-card"

import Link from "next/link"
import { usePushChainClient } from "@pushchain/ui-kit"
import { usePositions } from "@/hooks/use-positions"

export default function PositionsPage() {
  const { isInitialized: isConnected } = usePushChainClient()
  const { positions, loading, error, getAllPositions } = usePositions()

  // Fetch positions on mount or when wallet connects
  useEffect(() => {
    if (isConnected) {
      getAllPositions()
    }
  }, [isConnected, getAllPositions])

  useEffect(()=>{
    console.log("Positions:", positions)
  },[positions])

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
        ) : loading ? (
          <Card className="glass border-border/50 p-12 text-center">
            <div className="max-w-md mx-auto flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Loading Positions</h3>
              <p className="text-muted-foreground">Fetching your liquidity positions from the blockchain...</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="glass p-12 text-center border-red-500/20 bg-red-500/5">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-2 text-red-500">Error Loading Positions</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={() => getAllPositions()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Try Again
              </Button>
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
