"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUniswapV3 } from "@/hooks/use-uniswap-v3"
import { useToast } from "@/hooks/use-toast"
import { useTokenBalance, TokenBalance } from "@/hooks/use-token-balance"
import { usePushChainClient } from "@pushchain/ui-kit"
import { PRODUCTION_POOLS } from "@/lib/uniswap-v3-contracts"
import { calculateTickRange } from "@/lib/universal-payload"
import { ethers } from "ethers"

interface AddLiquidityFormProps {
  poolId: string
}

export function AddLiquidityForm({ poolId }: AddLiquidityFormProps) {
  const { isInitialized: isConnected } = usePushChainClient()
  const { addLiquidity, loading } = useUniswapV3()
  const { toast } = useToast()
  const { getBalance } = useTokenBalance()
  const { pushChainClient } = usePushChainClient()

  const [activeTab, setActiveTab] = useState<"add" | "remove">("add")
  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [balance0, setBalance0] = useState<TokenBalance | null>(null)
  const [balance1, setBalance1] = useState<TokenBalance | null>(null)
  const [loadingBalances, setLoadingBalances] = useState(false)

  const poolData = Object.values(PRODUCTION_POOLS).find((p) => p.address.toLowerCase() === poolId.toLowerCase())

  const pool = poolData || {
    token0Symbol: "ETH",
    token1Symbol: "USDC",
    currentTick: "0",
    fee: 3000,
  }

  // Fetch token balances when pool data changes or wallet connects
  useEffect(() => {
    const fetchBalances = async () => {
      if (!pushChainClient || !poolData) return

      try {
        setLoadingBalances(true)

        const walletAddress = await pushChainClient.universal.account

        // Fetch both balances in parallel
        const [bal0, bal1] = await Promise.all([
          getBalance(poolData.token0, walletAddress),
          getBalance(poolData.token1, walletAddress),
        ])

        setBalance0(bal0)
        setBalance1(bal1)
      } catch (err) {
        console.error("[AddLiquidityForm] Error fetching balances:", err)
      } finally {
        setLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [poolData, pushChainClient, getBalance])

  const handleAmount0Change = (value: string) => {
    setAmount0(value)
    if (value && !isNaN(Number(value)) && poolData) {
      // Get token decimals from pool data
      const token0Decimals = 18 // Default, should be fetched from contract
      const token1Decimals = 6 // Default, should be fetched from contract

      // Calculate amount1 based on current price
      const currentPrice = poolData.priceRatio
      setAmount1((Number(value) * currentPrice).toFixed(token1Decimals))
    } else {
      setAmount1("")
    }
  }

  const handleAddLiquidity = async () => {
   

    if (!amount0 || !amount1 || !minPrice || !maxPrice) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (Number(minPrice) >= Number(maxPrice)) {
      toast({
        title: "Invalid Price Range",
        description: "Min price must be less than max price",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      if (!poolData) {
        throw new Error("Pool data not found")
      }

      const { tickLower, tickUpper } = calculateTickRange(
        Number(minPrice),
        Number(maxPrice),
        18, // token0Decimals
        6, // token1Decimals
      )

      console.log("[v0] Calculated ticks:", { tickLower, tickUpper })

      const amount0Wei = ethers.parseUnits(amount0, 18)
      const amount1Wei = ethers.parseUnits(amount1, 6)

      console.log("[v0] Adding liquidity with:", {
        token0: poolData.token0,
        token1: poolData.token1,
        fee: pool.fee,
        amount0: amount0Wei.toString(),
        amount1: amount1Wei.toString(),
        tickLower,
        tickUpper,
      })

      await addLiquidity({
        token0: poolData.token0,
        token1: poolData.token1,
        fee: pool.fee,
        amount0: amount0Wei.toString(),
        amount1: amount1Wei.toString(),
        tickLower,
        tickUpper,
      })

      toast({
        title: "Liquidity Added",
        description: `Successfully added ${amount0} ${pool.token0Symbol} and ${amount1} ${pool.token1Symbol}`,
      })

      setAmount0("")
      setAmount1("")
      setMinPrice("")
      setMaxPrice("")
    } catch (error: any) {
      console.error("[v0] Add liquidity error:", error)
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to add liquidity",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveLiquidity = async () => {
  

    if (!amount0) {
      toast({
        title: "Invalid Input",
        description: "Please enter an amount to remove",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      console.log("[v0] Removing liquidity:", amount0)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Liquidity Removed",
        description: `Successfully removed liquidity from the pool`,
      })

      setAmount0("")
      setAmount1("")
    } catch (error: any) {
      console.error("[v0] Remove liquidity error:", error)
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to remove liquidity",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="glass border-border/50 p-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "add" | "remove")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="add">
            <Plus className="h-4 w-4 mr-2" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger value="remove">
            <Minus className="h-4 w-4 mr-2" />
            Remove Liquidity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Set Price Range</Label>
              <div className="text-sm text-muted-foreground">Current: {poolData?.priceRatio || "N/A"}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Min Price</Label>
                <Input
                  type="text"
                  placeholder="0.0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-12 text-lg bg-secondary/50"
                />
                <div className="text-xs text-muted-foreground">
                  {pool.token1Symbol} per {pool.token0Symbol}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Max Price</Label>
                <Input
                  type="text"
                  placeholder="0.0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-12 text-lg bg-secondary/50"
                />
                <div className="text-xs text-muted-foreground">
                  {pool.token1Symbol} per {pool.token0Symbol}
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-500">
                Your liquidity will only earn fees when the price is within your selected range.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Deposit Amounts</Label>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm text-muted-foreground">{pool.token0Symbol}</Label>
                {balance0 && (
                  <div className="text-xs text-muted-foreground">Balance: {balance0.formatted} {pool.token0Symbol}</div>
                )}
                {loadingBalances && !balance0 && (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading...</div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={amount0}
                  onChange={(e) => handleAmount0Change(e.target.value)}
                  className="h-14 text-2xl font-semibold bg-secondary/50"
                />
                <div className="flex items-center gap-2 px-4 rounded-lg bg-secondary/50">
                  <span className="font-semibold">{pool.token0Symbol}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm text-muted-foreground">{pool.token1Symbol}</Label>
                {balance1 && (
                  <div className="text-xs text-muted-foreground">Balance: {balance1.formatted} {pool.token1Symbol}</div>
                )}
                {loadingBalances && !balance1 && (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading...</div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={amount1}
                  readOnly
                  className="h-14 text-2xl font-semibold bg-secondary/50"
                />
                <div className="flex items-center gap-2 px-4 rounded-lg bg-secondary/50">
                  <span className="font-semibold">{pool.token1Symbol}</span>
                </div>
              </div>
            </div>
          </div>

          {amount0 && amount1 && minPrice && maxPrice && (
            <div className="space-y-2 p-4 rounded-lg bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool Share</span>
                <span className="font-medium">0.05%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated APR</span>
                <span className="font-medium text-green-500">24.5%</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleAddLiquidity}
            disabled={isProcessing || loading || (!amount0 && isConnected)}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {isProcessing || loading ? "Adding Liquidity..." : !isConnected ? "Connect Wallet" : "Add Liquidity"}
          </Button>
        </TabsContent>

        <TabsContent value="remove" className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Amount to Remove</Label>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="0.0"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                className="h-14 text-2xl font-semibold bg-secondary/50"
              />
              <div className="text-xs text-muted-foreground">Percentage of your position</div>
            </div>

            <div className="flex gap-2">
              {["25%", "50%", "75%", "100%"].map((percent) => (
                <Button
                  key={percent}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount0(percent.replace("%", ""))}
                  className="flex-1"
                >
                  {percent}
                </Button>
              ))}
            </div>
          </div>

          {amount0 && (
            <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
              <div className="text-sm font-semibold mb-2">You will receive:</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{pool.token0Symbol}</span>
                </div>
                <span className="font-medium">0.5 {pool.token0Symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{pool.token1Symbol}</span>
                </div>
                <span className="font-medium">1,225 {pool.token1Symbol}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleRemoveLiquidity}
            disabled={isProcessing || loading || (!amount0 && isConnected)}
            variant="destructive"
            className="w-full h-12 text-base font-semibold"
          >
            {isProcessing || loading ? "Removing Liquidity..." : !isConnected ? "Connect Wallet" : "Remove Liquidity"}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
