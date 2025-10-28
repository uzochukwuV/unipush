"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface SwapSettingsProps {
  slippage: string
  onSlippageChange: (value: string) => void
  onClose: () => void
}

const PRESET_SLIPPAGE = ["0.1", "0.5", "1.0"]

export function SwapSettings({ slippage, onSlippageChange, onClose }: SwapSettingsProps) {
  return (
    <div className="mb-4 p-4 rounded-lg bg-secondary/50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Settings</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Slippage Tolerance</Label>
        <div className="flex gap-2">
          {PRESET_SLIPPAGE.map((preset) => (
            <Button
              key={preset}
              variant={slippage === preset ? "default" : "outline"}
              size="sm"
              onClick={() => onSlippageChange(preset)}
              className="flex-1"
            >
              {preset}%
            </Button>
          ))}
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Custom"
              value={slippage}
              onChange={(e) => onSlippageChange(e.target.value)}
              className="h-9 pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your transaction will revert if the price changes unfavorably by more than this percentage.
        </p>
      </div>
    </div>
  )
}
