"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type PushChainClient,
  initializePushChainEVM,
  initializePushChainSolana,
  getUserChainInfo,
} from "@/lib/push-chain"
// Import necessary components from @pushchain/ui-kit
import {
  PushUniversalWalletProvider,
  PushUniversalAccountButton,
  PushUI,
  usePushWalletContext,
  usePushChainClient,
} from '@pushchain/ui-kit';

interface PushChainContextType {
  client: PushChainClient | null
  account: string | null
  chainId: number | null
  chainName: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectEVM: () => Promise<void>
  connectSolana: () => Promise<void>
  disconnect: () => void
}

const PushChainContext = createContext<PushChainContextType | undefined>(undefined)

export function PushChainProvider({ children }: { children: ReactNode }) {
  
  const walletConfig = {
    network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
  };

  return (
    <PushUniversalWalletProvider config={walletConfig}>
     {children}
    </PushUniversalWalletProvider>
      
  )
}
