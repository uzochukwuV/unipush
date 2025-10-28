"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TokenSelector } from "@/components/token-selector"
import { useUniswapV3 } from "@/hooks/use-uniswap-v3"
import { useToast } from "@/hooks/use-toast"
import { Info } from "lucide-react"
import { usePushChainClient } from "@pushchain/ui-kit"
import { POPULAR_TOKENS, Token } from "@/lib/constants"

const FEE_TIERS = [
  { value: 100, label: "0.01%", description: "Best for stable pairs" },
  { value: 500, label: "0.05%", description: "Best for stable pairs" },
  { value: 3000, label: "0.3%", description: "Best for most pairs" },
  { value: 10000, label: "1%", description: "Best for exotic pairs" },
]

interface CreatePoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePoolDialog({ open, onOpenChange }: CreatePoolDialogProps) {
  const { isInitialized: isConnected } = usePushChainClient()
  const { createPool, loading } = useUniswapV3()
  const { toast } = useToast()

  const [token0, setToken0] = useState<Token>(POPULAR_TOKENS[0])
  const [token1, setToken1] = useState<Token>(POPULAR_TOKENS[1])
  const [selectedFee, setSelectedFee] = useState(3000)
  const [priceRatio, setPriceRatio] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreatePool = async () => {
  

    if (token0.address.toLowerCase() === token1.address.toLowerCase()) {
      toast({
        title: "Invalid Tokens",
        description: "Please select two different tokens",
        variant: "destructive",
      })
      return
    }

    if (!priceRatio || isNaN(Number(priceRatio)) || Number(priceRatio) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid positive price ratio",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      console.log("[v0] Creating pool with:", {
        token0: token0.address,
        token1: token1.address,
        fee: selectedFee,
        priceRatio: Number(priceRatio),
      })

      const poolAddress = await createPool(
        token0.address,
        token1.address,
        selectedFee,
        Number(priceRatio),
        token0.decimals,
        token1.decimals,
      )

      toast({
        title: "Pool Created",
        description: `Successfully created ${token0.symbol}/${token1.symbol} pool at ${poolAddress}`,
      })

      setPriceRatio("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Pool creation error:", error)
      toast({
        title: "Pool Creation Failed",
        description: error.message || "Failed to create pool",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Pool</DialogTitle>
          <DialogDescription>
            Create a new liquidity pool for a token pair. You'll be the first liquidity provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Token 1</Label>
              <TokenSelector selectedToken={token0} onSelectToken={setToken0} tokens={POPULAR_TOKENS} />
            </div>

            <div className="space-y-2">
              <Label>Token 2</Label>
              <TokenSelector selectedToken={token1} onSelectToken={setToken1} tokens={POPULAR_TOKENS} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Initial Price Ratio</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 2300"
                value={priceRatio}
                onChange={(e) => setPriceRatio(e.target.value)}
                className="h-12 text-lg bg-secondary/50"
              />
              <div className="flex items-center px-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                {token1.symbol}/{token0.symbol}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              1 {token0.symbol} = {priceRatio || "?"} {token1.symbol}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fee Tier</Label>
            <div className="grid grid-cols-2 gap-2">
              {FEE_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setSelectedFee(tier.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedFee === tier.value
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="font-semibold mb-1">{tier.label}</div>
                  <div className="text-xs text-muted-foreground">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-500">
              Creating a pool requires an initial liquidity deposit. You'll be redirected to add liquidity after pool
              creation.
            </p>
          </div>

          <Button
            onClick={handleCreatePool}
            disabled={isCreating || loading || token0.address === token1.address || !priceRatio}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {isCreating || loading ? "Creating Pool..." : !isConnected ? "Connect Wallet" : "Create Pool"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
