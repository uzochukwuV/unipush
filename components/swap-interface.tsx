"use client"

import { useState, useEffect } from "react"
import { ArrowDownUp, Settings, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenSelector } from "@/components/token-selector"
import { SwapSettings } from "@/components/swap-settings"
import { useUniswapV3 } from "@/hooks/use-uniswap-v3"
import { useToast } from "@/hooks/use-toast"
import { useTokenBalance, TokenBalance } from "@/hooks/use-token-balance"
import { usePushChainClient } from "@pushchain/ui-kit"
import { PRODUCTION_POOLS } from "@/lib/uniswap-v3-contracts"
import { POPULAR_TOKENS, Token } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ethers } from "ethers"

export function SwapInterface() {
  const { swap, loading, error } = useUniswapV3()
  const { toast } = useToast()
  const { getBalance } = useTokenBalance()
  const { pushChainClient } = usePushChainClient()

  const [fromToken, setFromToken] = useState<Token>(POPULAR_TOKENS[0])
  const [toToken, setToToken] = useState<Token>(POPULAR_TOKENS[1])
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isSwapping, setIsSwapping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fromBalance, setFromBalance] = useState<TokenBalance | null>(null)
  const [toBalance, setToBalance] = useState<TokenBalance | null>(null)
  const [loadingBalances, setLoadingBalances] = useState(false)

  // Fetch balances when tokens or wallet changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!pushChainClient) return

      try {
        setLoadingBalances(true)

        const walletAddress = await pushChainClient.universal.account

        // Fetch both balances in parallel
        const [fromBal, toBal] = await Promise.all([
          getBalance(fromToken.address, walletAddress),
          getBalance(toToken.address, walletAddress),
        ])

        setFromBalance(fromBal)
        setToBalance(toBal)
      } catch (err) {
        console.error("[SwapInterface] Error fetching balances:", err)
      } finally {
        setLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [fromToken, toToken, pushChainClient, getBalance])

  const getExchangeRate = () => {
    const pool = Object.values(PRODUCTION_POOLS).find(
      (p) =>
        (p.token0.toLowerCase() === fromToken.address.toLowerCase() &&
          p.token1.toLowerCase() === toToken.address.toLowerCase()) ||
        (p.token0.toLowerCase() === toToken.address.toLowerCase() &&
          p.token1.toLowerCase() === fromToken.address.toLowerCase()),
    )

    if (!pool) return "N/A"

    // Determine if we need to invert the price
    const isInverted =
      pool.token0.toLowerCase() === toToken.address.toLowerCase() &&
      pool.token1.toLowerCase() === fromToken.address.toLowerCase()

    const rate = isInverted ? 1 / pool.priceRatio : pool.priceRatio
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && !isNaN(Number(value))) {
      const pool = Object.values(PRODUCTION_POOLS).find(
        (p) =>
          (p.token0.toLowerCase() === fromToken.address.toLowerCase() &&
            p.token1.toLowerCase() === toToken.address.toLowerCase()) ||
          (p.token0.toLowerCase() === toToken.address.toLowerCase() &&
            p.token1.toLowerCase() === fromToken.address.toLowerCase()),
      )

      if (pool) {
        const isInverted =
          pool.token0.toLowerCase() === toToken.address.toLowerCase() &&
          pool.token1.toLowerCase() === fromToken.address.toLowerCase()

        const rate = isInverted ? 1 / pool.priceRatio : pool.priceRatio
        setToAmount((Number(value) * rate).toFixed(toToken.decimals))
      }
    } else {
      setToAmount("")
    }
  }

  const exchangeRate = getExchangeRate()
  const priceImpact = fromAmount ? "0.12%" : ""

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
  

    if (!fromAmount || !toAmount) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount to swap",
        variant: "destructive",
      })
      return
    }

    setIsSwapping(true)

    try {
      const pool = Object.values(PRODUCTION_POOLS).find(
        (p) =>
          (p.token0.toLowerCase() === fromToken.address.toLowerCase() &&
            p.token1.toLowerCase() === toToken.address.toLowerCase()) ||
          (p.token0.toLowerCase() === toToken.address.toLowerCase() &&
            p.token1.toLowerCase() === fromToken.address.toLowerCase()),
      )

      if (!pool) {
        throw new Error("No pool found for this token pair")
      }

      const amountInWei = ethers.parseUnits(fromAmount, fromToken.decimals)
      const minAmountOut = ethers.parseUnits(
        (Number(toAmount) * (1 - Number(slippage) / 100)).toString(),
        toToken.decimals,
      )

      console.log("[v0] Swap params:", {
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        fee: pool.fee,
        amountIn: amountInWei.toString(),
        amountOutMinimum: minAmountOut.toString(),
      })

      await swap({
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        fee: pool.fee,
        amountIn: amountInWei.toString(),
        amountOutMinimum: minAmountOut.toString(),
        slippage: Number(slippage),
      })

      toast({
        title: "Swap Successful",
        description: `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
      })

      setFromAmount("")
      setToAmount("")
    } catch (err: any) {
      console.error("[v0] Swap error:", err)
      toast({
        title: "Swap Failed",
        description: err.message || "Failed to execute swap",
        variant: "destructive",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  return (
    <Card className="glass border-border/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Swap</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SwapSettings slippage={slippage} onSlippageChange={setSlippage} onClose={() => setShowSettings(false)} />
      )}

      {/* From Token */}
      <div className="space-y-2 mb-2">
        <Label className="text-sm text-muted-foreground">From</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="h-14 text-2xl font-semibold bg-secondary/50 border-0"
            />
          </div>
          <TokenSelector selectedToken={fromToken} onSelectToken={setFromToken} tokens={POPULAR_TOKENS} />
        </div>
        {fromBalance && (
          <div className="text-xs text-muted-foreground">
            Balance: {fromBalance.formatted} {fromToken.symbol}
          </div>
        )}
        {loadingBalances && !fromBalance && (
          <div className="text-xs text-muted-foreground animate-pulse">
            Loading balance...
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSwapTokens}
          className="h-10 w-10 rounded-full border-4 border-card bg-secondary hover:bg-muted"
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      {/* To Token */}
      <div className="space-y-2 mb-4">
        <Label className="text-sm text-muted-foreground">To</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="h-14 text-2xl font-semibold bg-secondary/50 border-0"
            />
          </div>
          <TokenSelector selectedToken={toToken} onSelectToken={setToToken} tokens={POPULAR_TOKENS} />
        </div>
        {toBalance && (
          <div className="text-xs text-muted-foreground">
            Balance: {toBalance.formatted} {toToken.symbol}
          </div>
        )}
        {loadingBalances && !toBalance && (
          <div className="text-xs text-muted-foreground animate-pulse">
            Loading balance...
          </div>
        )}
      </div>

      {/* Swap Details */}
      {fromAmount && toAmount && (
        <div className="space-y-2 mb-4 p-3 rounded-lg bg-secondary/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-medium">{exchangeRate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price Impact</span>
            <span className={cn("font-medium", priceImpact && "text-green-500")}>{priceImpact}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <span className="font-medium">{slippage}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>Network Fee</span>
              <Info className="h-3 w-3" />
            </div>
            <span className="font-medium">~$2.50</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={isSwapping || loading || (!fromAmount)}
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
      >
        {isSwapping || loading ? "Swapping..."  : "Swap"}
      </Button>
    </Card>
  )
}
