"use client"

import { useState } from "react"
import { MoreVertical, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"

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

interface PositionCardProps {
  position: Position
}

export function PositionCard({ position }: PositionCardProps) {
  const { toast } = useToast()
  const [isCollecting, setIsCollecting] = useState(false)

  const isProfitable = position.pnl >= 0

  const handleCollectFees = async () => {
    setIsCollecting(true)

    try {
      // Mock fee collection - in real app, call position manager contract
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Fees Collected",
        description: `Collected ${position.uncollectedFees0} ${position.token0.symbol} and ${position.uncollectedFees1} ${position.token1.symbol}`,
      })
    } catch (error: any) {
      toast({
        title: "Collection Failed",
        description: error.message || "Failed to collect fees",
        variant: "destructive",
      })
    } finally {
      setIsCollecting(false)
    }
  }

  return (
    <Card className="glass border-border/50 p-6 hover:border-pink-500/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Token Pair */}
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-2">
            <Image
              src={position.token0.logoUrl || "/placeholder.svg"}
              alt={position.token0.symbol}
              width={40}
              height={40}
              className="rounded-full border-2 border-card"
            />
            <Image
              src={position.token1.logoUrl || "/placeholder.svg"}
              alt={position.token1.symbol}
              width={40}
              height={40}
              className="rounded-full border-2 border-card"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">
                {position.token0.symbol}/{position.token1.symbol}
              </span>
              <Badge variant="secondary" className="text-xs">
                {position.fee}%
              </Badge>
              <Badge variant={position.inRange ? "default" : "secondary"} className="text-xs">
                {position.inRange ? "In Range" : "Out of Range"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">Position #{position.id}</div>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/pools/${position.poolId}/add`}>Add Liquidity</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/pools/${position.poolId}/add`}>Remove Liquidity</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Position Details */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        {/* Left Column */}
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Liquidity</div>
            <div className="font-semibold">{position.liquidity}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Value</div>
            <div className="font-semibold text-lg">{position.totalValue}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">P&L</div>
            <div
              className={cn("flex items-center gap-1 font-semibold", isProfitable ? "text-green-500" : "text-red-500")}
            >
              {isProfitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isProfitable ? "+" : ""}
              {position.pnl}%
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Price Range</div>
            <div className="font-semibold">
              {position.minPrice} - {position.maxPrice}
            </div>
            <div className="text-xs text-muted-foreground">
              Current: {position.currentPrice} {position.token1.symbol}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Uncollected Fees</div>
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {position.uncollectedFees0} {position.token0.symbol}
              </div>
              <div className="text-sm font-medium">
                {position.uncollectedFees1} {position.token1.symbol}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleCollectFees} disabled={isCollecting} variant="outline" className="flex-1 bg-transparent">
          {isCollecting ? "Collecting..." : "Collect Fees"}
        </Button>
        <Link href={`/pools/${position.poolId}`} className="flex-1">
          <Button variant="outline" className="w-full bg-transparent">
            View Pool
          </Button>
        </Link>
        <Link href={`/pools/${position.poolId}/add`} className="flex-1">
          <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
            Manage Position
          </Button>
        </Link>
      </div>
    </Card>
  )
}
