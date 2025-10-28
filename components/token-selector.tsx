"use client"

import { useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Token } from "@/lib/constants"
import Image from "next/image"

interface TokenSelectorProps {
  selectedToken: Token
  onSelectToken: (token: Token) => void
  tokens: Token[]
}

export function TokenSelector({ selectedToken, onSelectToken, tokens }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = (token: Token) => {
    onSelectToken(token)
    setOpen(false)
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-14 px-3 bg-secondary/50 border-0 hover:bg-muted">
          <div className="flex items-center gap-2">
            {selectedToken.logoUrl && (
              <Image
                src={selectedToken.logoUrl || "/placeholder.svg"}
                alt={selectedToken.symbol}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span className="font-semibold">{selectedToken.symbol}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Token List */}
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors",
                  selectedToken.address === token.address && "bg-muted",
                )}
              >
                <div className="flex items-center gap-3">
                  {token.logoUrl && (
                    <Image
                      src={token.logoUrl || "/placeholder.svg"}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">{token.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedToken.address === token.address && <Check className="h-4 w-4 text-pink-500" />}
                </div>
              </button>
            ))}
            {filteredTokens.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No tokens found</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
