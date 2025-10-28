"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react"
import { useState } from "react"
import {
  PushUniversalWalletProvider,
  PushUniversalAccountButton,
  PushUI,
} from '@pushchain/ui-kit';

export function WalletConnectButton() {
  return (
    <div className="max-w-2xs">
      
      <PushUniversalAccountButton
       
        
       
      />
    </div>
  )
}
