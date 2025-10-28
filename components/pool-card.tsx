"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

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

interface PoolCardProps {
  pool: Pool
}

export function PoolCard({ pool }: PoolCardProps) {
  const isPositive = pool.priceChange24h >= 0

  return (
    <Card className="glass border-border/50 p-6 hover:border-pink-500/50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Token Pair */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center -space-x-2">
            <Image
              src={pool.token0.logoUrl || "/placeholder.svg"}
              alt={pool.token0.symbol}
              width={40}
              height={40}
              className="rounded-full border-2 border-card"
            />
            <Image
              src={pool.token1.logoUrl || "/placeholder.svg"}
              alt={pool.token1.symbol}
              width={40}
              height={40}
              className="rounded-full border-2 border-card"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">
                {pool.token0.symbol}/{pool.token1.symbol}
              </span>
              <Badge variant="secondary" className="text-xs">
                {pool.fee}%
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {pool.token0.name} / {pool.token1.name}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-8">
          <div>
            <div className="text-sm text-muted-foreground mb-1">TVL</div>
            <div className="font-semibold">{pool.tvl}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
            <div className="font-semibold">{pool.volume24h}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">7d Volume</div>
            <div className="font-semibold">{pool.volume7d}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">APR</div>
            <div className="font-semibold text-green-500">{pool.apr}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">24h Change</div>
            <div
              className={cn("flex items-center gap-1 font-semibold", isPositive ? "text-green-500" : "text-red-500")}
            >
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(pool.priceChange24h)}%
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/pools/${pool.id}`}>
            <Button variant="outline" size="sm">
              View Pool
            </Button>
          </Link>
          <Link href={`/pools/${pool.id}/add`}>
            <Button
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Add Liquidity
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
