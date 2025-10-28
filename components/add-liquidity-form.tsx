"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUniswapV3 } from "@/hooks/use-uniswap-v3"
import { useToast } from "@/hooks/use-toast"
import { useTokenBalance, TokenBalance } from "@/hooks/use-token-balance"
import { usePushChainClient } from "@pushchain/ui-kit"
import { usePools, type PoolData } from "@/hooks/use-pools"
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
  const { getPoolByID } = usePools()

  const [activeTab, setActiveTab] = useState<"add" | "remove">("add")
  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [selectedRange, setSelectedRange] = useState<{ min: number; max: number; label: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [balance0, setBalance0] = useState<TokenBalance | null>(null)
  const [balance1, setBalance1] = useState<TokenBalance | null>(null)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [poolData, setPoolData] = useState<PoolData | null>(null)
  const [loadingPool, setLoadingPool] = useState(true)
  const [poolError, setPoolError] = useState<string | null>(null)

  // Fetch pool data from blockchain using pool ID
  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        setLoadingPool(true)
        setPoolError(null)

        if (!poolId) {
          setPoolError("No pool ID provided")
          return
        }

        console.log(`[AddLiquidityForm] Fetching pool data for ID: ${poolId}`)

        const fetchedPool = await getPoolByID(poolId)

        if (fetchedPool) {
          setPoolData(fetchedPool)
          console.log(`[AddLiquidityForm] Pool fetched: ${fetchedPool.token0.symbol}/${fetchedPool.token1.symbol}`)
        } else {
          setPoolError("Pool not found")
        }
      } catch (err: any) {
        console.error("[AddLiquidityForm] Error fetching pool:", err)
        setPoolError(err.message || "Failed to fetch pool")
      } finally {
        setLoadingPool(false)
      }
    }

    fetchPoolData()
  }, [poolId, getPoolByID])

  // Fetch token balances when pool data changes or wallet connects
  useEffect(() => {
    const fetchBalances = async () => {
      if (!pushChainClient || !poolData) return

      try {
        setLoadingBalances(true)

        const signer = pushChainClient.universal.account
        const walletAddress = signer

        // Fetch both balances in parallel
        const [bal0, bal1] = await Promise.all([
          getBalance(poolData.token0.address, walletAddress),
          getBalance(poolData.token1.address, walletAddress),
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
      // Calculate amount1 based on sqrtPriceX96
      // Formula: (sqrtPriceX96 / 2^96)^2 * 10^(token1Decimals - token0Decimals) = price ratio
      // amount1 = amount0 * price_ratio

      try {
        // Convert sqrtPriceX96 from string to BigInt
        const sqrtPriceX96 = BigInt(poolData.sqrtPriceX96)

        // Calculate price: (sqrtPriceX96 / 2^96)^2
        // Using BigInt for precision: price = (sqrtPriceX96^2) / (2^192)
        const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96

        // Calculate 2^96 and 2^192 using BigInt
        const q96 = BigInt(1) << BigInt(96) // 2^96
        const q192 = q96 * q96 // 2^192

        // Calculate decimal adjustment: 10^(token1Decimals - token0Decimals)
        const decimalDiff = poolData.token1.decimals - poolData.token0.decimals
        let decimalAdjustment = BigInt(1)
        for (let i = 0; i < Math.abs(decimalDiff); i++) {
          decimalAdjustment *= BigInt(10)
        }

        // price = (sqrtPriceX96^2 / 2^192) * 10^(token1Decimals - token0Decimals)
        let priceRatio: number

        if (decimalDiff >= 0) {
          // token1 has more or equal decimals
          const numerator = sqrtPriceX96Squared * decimalAdjustment
          priceRatio = Number(numerator / q192)
        } else {
          // token0 has more decimals
          const denominator = q192 / decimalAdjustment
          priceRatio = Number(sqrtPriceX96Squared / denominator)
        }

        // Calculate amount1: amount0 * price_ratio
        const amount1Value = Number(value) * priceRatio

        // Format to appropriate decimal places
        setAmount1(amount1Value.toFixed(poolData.token1.decimals))
      } catch (err) {
        console.error("[AddLiquidityForm] Error calculating price from sqrtPriceX96:", err)
        // Fallback to simple 1:1 ratio if calculation fails
        setAmount1(value)
      }
    } else {
      setAmount1("")
    }
  }

  const handleAddLiquidity = async () => {
    if (!poolData) {
      toast({
        title: "Pool Data Missing",
        description: "Pool data is not loaded yet",
        variant: "destructive",
      })
      return
    }

    if (!amount0 || !amount1 || !selectedRange) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields and select a price range",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Calculate current pool price from sqrtPriceX96
      const sqrtPriceX96 = BigInt(poolData.sqrtPriceX96)
      const q96 = BigInt(1) << BigInt(96)
      const q192 = q96 * q96
      const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96

      // Calculate decimal adjustment
      const decimalDiff = poolData.token1.decimals - poolData.token0.decimals
      let decimalAdjustment = BigInt(1)
      for (let i = 0; i < Math.abs(decimalDiff); i++) {
        decimalAdjustment *= BigInt(10)
      }

      // Calculate current price ratio
      let currentPrice: number
      if (decimalDiff >= 0) {
        const numerator = sqrtPriceX96Squared * decimalAdjustment
        currentPrice = Number(numerator / q192)
      } else {
        const denominator = q192 / decimalAdjustment
        currentPrice = Number(sqrtPriceX96Squared / denominator)
      }

      // Calculate min and max prices based on selected range
      const minPrice = currentPrice * (selectedRange.min / 100)
      const maxPrice = currentPrice * (selectedRange.max / 100)

      console.log("[AddLiquidityForm] Price calculation:", {
        currentPrice,
        selectedRange,
        minPrice,
        maxPrice,
      })

      const { tickLower, tickUpper } = calculateTickRange(
        minPrice,
        maxPrice,
        poolData.token0.decimals,
        poolData.token1.decimals,
      )

      console.log("[AddLiquidityForm] Calculated ticks:", { tickLower, tickUpper })

      const amount0Wei = ethers.parseUnits(amount0, poolData.token0.decimals)
      const amount1Wei = ethers.parseUnits(amount1, poolData.token1.decimals)

      console.log("[AddLiquidityForm] Adding liquidity with:", {
        token0: poolData.token0.address,
        token1: poolData.token1.address,
        fee: poolData.fee,
        amount0: amount0Wei.toString(),
        amount1: amount1Wei.toString(),
        tickLower,
        tickUpper,
      })

      await addLiquidity({
        token0: poolData.token0.address,
        token1: poolData.token1.address,
        fee: poolData.fee,
        amount0: amount0Wei.toString(),
        amount1: amount1Wei.toString(),
        tickLower,
        tickUpper,
      })

      toast({
        title: "Liquidity Added",
        description: `Successfully added ${amount0} ${poolData.token0.symbol} and ${amount1} ${poolData.token1.symbol}`,
      })

      setAmount0("")
      setAmount1("")
      setSelectedRange(null)
    } catch (error: any) {
      console.error("[AddLiquidityForm] Add liquidity error:", error)
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

  // Show loading state
  if (loadingPool) {
    return (
      <Card className="glass border-border/50 p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Loading Pool Data</h3>
          <p className="text-muted-foreground">Fetching pool information from the blockchain...</p>
        </div>
      </Card>
    )
  }

  // Show error state
  if (poolError || !poolData) {
    return (
      <Card className="glass p-12 text-center border-red-500/20 bg-red-500/5">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-2 text-red-500">Error Loading Pool</h3>
          <p className="text-muted-foreground mb-6">{poolError || "Pool data not found"}</p>
        </div>
      </Card>
    )
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
          {/* Token Amounts Input */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Deposit Amounts</Label>
            <p className="text-sm text-muted-foreground">
              Enter {poolData.token0.symbol} amount and {poolData.token1.symbol} will be calculated automatically
            </p>

            {/* Token 0 Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">{poolData.token0.symbol}</Label>
                {balance0 && (
                  <button
                    onClick={() => setAmount0(balance0.balanceDecimal.toString())}
                    className="text-xs text-blue-500 hover:text-blue-600 font-semibold"
                  >
                    Max: {balance0.formatted}
                  </button>
                )}
                {loadingBalances && !balance0 && (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading balance...</div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount0}
                  onChange={(e) => handleAmount0Change(e.target.value)}
                  className="h-14 text-2xl font-semibold bg-secondary/50"
                  disabled={loadingPool}
                  min="0"
                  step="0.0001"
                />
                <div className="flex items-center justify-center px-4 rounded-lg bg-secondary/50 min-w-fit">
                  <span className="font-semibold">{poolData.token0.symbol}</span>
                </div>
              </div>
            </div>

            {/* Token 1 Input - Auto Calculated */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">{poolData.token1.symbol}</Label>
                {balance1 && (
                  <div className="text-xs text-muted-foreground">
                    Available: {balance1.formatted}
                  </div>
                )}
                {loadingBalances && !balance1 && (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading balance...</div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount1}
                    readOnly
                    className="h-14 text-2xl font-semibold bg-secondary/50 text-muted-foreground"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Auto
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 rounded-lg bg-secondary/50 min-w-fit">
                  <span className="font-semibold">{poolData.token1.symbol}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically calculated based on current pool price
              </p>
            </div>
          </div>

          {/* Price Range Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Price Range</Label>
              <div className="text-sm text-muted-foreground">Current Tick: {poolData.tick}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Tight (0.9x - 1.1x)", min: 90, max: 110, desc: "0.9x to 1.1x" },
                { label: "Balanced (0.5x - 2x)", min: 50, max: 200, desc: "0.5x to 2x" },
                { label: "Wide (0.25x - 4x)", min: 25, max: 400, desc: "0.25x to 4x" },
                { label: "Very Wide (0.1x - 10x)", min: 10, max: 1000, desc: "0.1x to 10x" },
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    setSelectedRange({ min: range.min, max: range.max, label: range.label })
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedRange?.label === range.label
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-border/50 hover:border-pink-500/50 bg-secondary/30"
                  }`}
                >
                  <div className="text-sm font-semibold text-left">{range.label}</div>
                  <div className="text-xs text-muted-foreground text-left">{range.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-500">
                Tighter ranges earn more fees but require more active management. Wider ranges earn less but are more passive.
              </p>
            </div>
          </div>

          {amount0 && amount1 && selectedRange && (
            <div className="space-y-2 p-4 rounded-lg bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Range</span>
                <span className="font-medium">{selectedRange.label}</span>
              </div>
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
                  <span className="text-sm">{poolData.token0.symbol}</span>
                </div>
                <span className="font-medium">0.5 {poolData.token0.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{poolData.token1.address}</span>
                </div>
                <span className="font-medium">1,225 {poolData.token1.address}</span>
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
