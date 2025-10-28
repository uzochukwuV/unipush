"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { WalletConnectButton } from "./wallet-connect-button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Swap", href: "/" },
  { name: "Pools", href: "/pools" },
  { name: "Positions", href: "/positions" },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
              <span className="text-lg font-bold text-white">U</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              UniPush
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-pink-500/10 text-pink-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Wallet Connect */}
        <WalletConnectButton />
      </div>
    </header>
  )
}
