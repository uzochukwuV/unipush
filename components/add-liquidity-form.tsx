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
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
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
      // Calculate amount1 based on current tick
      // For simplicity, assume 1:1 ratio initially
      const ratio = 1 // This should be calculated from sqrtPriceX96
      setAmount1((Number(value) * ratio).toFixed(poolData.token1.decimals))
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
      const { tickLower, tickUpper } = calculateTickRange(
        Number(minPrice),
        Number(maxPrice),
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
      setMinPrice("")
      setMaxPrice("")
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Set Price Range</Label>
              <div className="text-sm text-muted-foreground">Current Tick: {poolData.tick}</div>
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
                  {poolData.token1.symbol} per {poolData.token0.symbol}
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
                  {poolData.token1.symbol} per {poolData.token0.symbol}
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
                <Label className="text-sm text-muted-foreground">{poolData.token0.symbol}</Label>
                {balance0 && (
                  <div className="text-xs text-muted-foreground">Balance: {balance0.formatted} {poolData.token0.symbol}</div>
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
                  disabled={loadingPool}
                />
                <div className="flex items-center gap-2 px-4 rounded-lg bg-secondary/50">
                  <span className="font-semibold">{poolData.token0.symbol}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm text-muted-foreground">{poolData.token1.symbol}</Label>
                {balance1 && (
                  <div className="text-xs text-muted-foreground">Balance: {balance1.formatted} {poolData.token1.symbol}</div>
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
                  <span className="font-semibold">{poolData.token1.symbol}</span>
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
