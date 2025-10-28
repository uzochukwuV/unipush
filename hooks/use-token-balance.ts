"use client"

import { useState, useCallback } from "react"
import { ethers } from "ethers"
import { ERC20_ABI } from "@/lib/uniswap-v3-contracts"
import { usePushChainClient } from "@pushchain/ui-kit"

export interface TokenBalance {
  address: string
  balance: string
  balanceDecimal: number
  decimals: number
  formatted: string
}

export function useTokenBalance() {
  const { pushChainClient: client, isInitialized: isConnected } = usePushChainClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get token balance for a wallet address
   * Returns balance as string to handle large numbers
   */
  const getBalance = useCallback(
    async (tokenAddress: string, walletAddress: string): Promise<TokenBalance | null> => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        return null
      }

      if (!tokenAddress || !walletAddress) {
        const errorMsg = "Token address and wallet address are required"
        setError(errorMsg)
        return null
      }

      setLoading(true)
      setError(null)

      try {
        console.log(
          `[useTokenBalance] Fetching balance for ${tokenAddress} on wallet ${walletAddress}`,
        )

        const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org/')
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

        // Get balance and decimals in parallel
        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(walletAddress),
          tokenContract.decimals(),
        ])

        // Convert balance to decimal format
        const balanceDecimal = Number(ethers.formatUnits(balance, decimals))

        // Format balance for display
        let formatted: string
        if (balanceDecimal > 1000000) {
          formatted = `${(balanceDecimal / 1000000).toFixed(2)}M`
        } else if (balanceDecimal > 1000) {
          formatted = `${(balanceDecimal / 1000).toFixed(2)}K`
        } else if (balanceDecimal > 1) {
          formatted = balanceDecimal.toFixed(2)
        } else {
          formatted = balanceDecimal.toFixed(6)
        }

        const tokenBalance: TokenBalance = {
          address: tokenAddress,
          balance: balance.toString(),
          balanceDecimal,
          decimals,
          formatted,
        }

        console.log(`[useTokenBalance] Balance: ${formatted} (${balanceDecimal} raw)`)

        return tokenBalance
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch token balance"
        setError(errorMsg)
        console.error("[useTokenBalance] Error fetching balance:", err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [isConnected],
  )

  /**
   * Get balances for multiple tokens
   */
  const getBalances = useCallback(
    async (tokenAddresses: string[], walletAddress: string): Promise<TokenBalance[]> => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        return []
      }

      if (!walletAddress) {
        const errorMsg = "Wallet address is required"
        setError(errorMsg)
        return []
      }

      setLoading(true)
      setError(null)

      try {
        console.log(`[useTokenBalance] Fetching balances for ${tokenAddresses.length} tokens`)

        const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org/')
        const balances = await Promise.all(
          tokenAddresses.map(async (tokenAddress) => {
            try {
              const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

              const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(walletAddress),
                tokenContract.decimals(),
              ])

              const balanceDecimal = Number(ethers.formatUnits(balance, decimals))

              let formatted: string
              if (balanceDecimal > 1000000) {
                formatted = `${(balanceDecimal / 1000000).toFixed(2)}M`
              } else if (balanceDecimal > 1000) {
                formatted = `${(balanceDecimal / 1000).toFixed(2)}K`
              } else if (balanceDecimal > 1) {
                formatted = balanceDecimal.toFixed(2)
              } else {
                formatted = balanceDecimal.toFixed(6)
              }

              return {
                address: tokenAddress,
                balance: balance.toString(),
                balanceDecimal,
                decimals,
                formatted,
              }
            } catch (err) {
              console.error(`[useTokenBalance] Error fetching balance for ${tokenAddress}:`, err)
              return null
            }
          }),
        )

        const validBalances = balances.filter((b) => b !== null) as TokenBalance[]
        console.log(`[useTokenBalance] Fetched ${validBalances.length} balances`)

        return validBalances
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch token balances"
        setError(errorMsg)
        console.error("[useTokenBalance] Error fetching balances:", err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [isConnected],
  )

  /**
   * Get token allowance for a spender
   */
  const getAllowance = useCallback(
    async (
      tokenAddress: string,
      walletAddress: string,
      spenderAddress: string,
    ): Promise<string | null> => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        return null
      }

      try {
        console.log(
          `[useTokenBalance] Fetching allowance for ${tokenAddress} spender ${spenderAddress}`,
        )

        const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org/')
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        const allowance = await tokenContract.allowance(walletAddress, spenderAddress)

        console.log(`[useTokenBalance] Allowance: ${allowance.toString()}`)

        return allowance.toString()
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch allowance"
        setError(errorMsg)
        console.error("[useTokenBalance] Error fetching allowance:", err)
        return null
      }
    },
    [isConnected],
  )

  return {
    loading,
    error,
    getBalance,
    getBalances,
    getAllowance,
  }
}
