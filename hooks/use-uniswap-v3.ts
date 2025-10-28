"use client"

import { useState, useCallback } from "react"
import { ethers } from "ethers"
import { UNISWAP_V3_CONTRACTS } from "@/lib/uniswap-v3-contracts"
import {
  generateCreatePoolPayload,
  generateApprovePayload,
  generateSwapPayload,
  generateAddLiquidityPayload,
  generateDecreaseLiquidityPayload,
  generateCollectPayload,
  calculateSqrtPriceX96,
} from "@/lib/universal-payload"
import { usePushChainClient } from "@pushchain/ui-kit"

export interface SwapParams {
  tokenIn: string
  tokenOut: string
  fee: number
  amountIn: string
  amountOutMinimum: string
  slippage: number
}

export interface AddLiquidityParams {
  token0: string
  token1: string
  fee: number
  amount0: string
  amount1: string
  tickLower: number
  tickUpper: number
}

export interface RemoveLiquidityParams {
  tokenId: string | number
  liquidity: string
  amount0Min?: string
  amount1Min?: string
}

export function useUniswapV3() {

   const { pushChainClient: client, isInitialized: isConnected } = usePushChainClient(); // optional: pass uid 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeTransaction = useCallback(
    async (calldata: string, to: string) => {
      if (!client) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      // Add address validation
      if (!ethers.isAddress(to)) {
        const errorMsg = `Invalid address: ${to}`
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Executing transaction to:", to)
        console.log("[v0] Calldata:", calldata)

        // Execute via Push Chain universal transaction
        const result = await client.universal.sendTransaction({
          to: to as `0x${string}`,
          data: calldata as `0x${string}`,
          value: BigInt(0),
        })

        console.log("[v0] Transaction result:", result)
        return result
      } catch (err: any) {
        const errorMsg = err.message || "Transaction failed"
        setError(errorMsg)
        console.error("[v0] Transaction error:", err)
        throw new Error(errorMsg)
      } finally {
        setLoading(false)
      }
    },
    [client],
  )

  const approveToken = useCallback(
    async (tokenAddress: string, spenderAddress: string, amount: string) => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        console.log("[v0] Approving token:", tokenAddress, "for spender:", spenderAddress)
        const payload = generateApprovePayload(tokenAddress, spenderAddress, amount)
        return await executeTransaction(payload.data, payload.to)
      } catch (err: any) {
        console.error("[v0] Approval error:", err)
        throw err
      }
    },
    [executeTransaction, isConnected],
  )

  const createPool = useCallback(
    async (
      token0: string,
      token1: string,
      fee: number,
      priceRatio: number,
      token0Decimals: number,
      token1Decimals: number,
    ) => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        console.log("[v0] Creating and initializing pool with tokens:", token0, token1, "fee:", fee)

        // Calculate sqrtPriceX96 from price ratio
        const sqrtPriceX96 = calculateSqrtPriceX96(priceRatio, token0Decimals, token1Decimals)
        console.log("[v0] Calculated sqrtPriceX96:", sqrtPriceX96)

        // Create and initialize pool in a single atomic call using NonfungiblePositionManager
        const createPayload = generateCreatePoolPayload(
          UNISWAP_V3_CONTRACTS.positionManager,
          token0,
          token1,
          fee,
          sqrtPriceX96,
        )
        const createResult = await executeTransaction(createPayload.data, createPayload.to)
        console.log("[v0] Pool creation result:", createResult)

        return createResult
      } catch (err: any) {
        console.error("[v0] Pool creation error:", err)
        throw err
      }
    },
    [executeTransaction, isConnected],
  )

  const swap = useCallback(
    async (params: SwapParams) => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        console.log("[v0] Executing swap:", params)

        // Step 1: Approve tokenIn for SwapRouter
        const maxUint256 = ethers.MaxUint256.toString()
        console.log("[v0] Approving tokenIn for swap...")
        await approveToken(params.tokenIn, UNISWAP_V3_CONTRACTS.swapRouter, maxUint256)

        // Step 2: Execute swap
        const userAddress = client?.universal.account as string
        if (!userAddress) {
          throw new Error("User address not available")
        }

        const swapPayload = generateSwapPayload(
          UNISWAP_V3_CONTRACTS.swapRouter,
          params.tokenIn,
          params.tokenOut,
          params.fee,
          userAddress,
          params.amountIn,
          params.amountOutMinimum,
        )

        console.log("[v0] Executing swap transaction...")
        const result = await executeTransaction(swapPayload.data, swapPayload.to)
        console.log("[v0] Swap completed successfully")
        return result
      } catch (err: any) {
        console.error("[v0] Swap error:", err)
        throw err
      }
    },
    [executeTransaction, isConnected, approveToken, client?.universal.account],
  )

  const addLiquidity = useCallback(
    async (params: AddLiquidityParams) => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        console.log("[v0] Adding liquidity:", params)

        // Get user address
        const userAddress = client?.universal.account as string
        if (!userAddress) {
          throw new Error("User address not available")
        }

        // Step 1: Approve both tokens for PositionManager
        const maxUint256 = ethers.MaxUint256.toString()
        console.log("[v0] Approving token0...")
        await approveToken(params.token0, UNISWAP_V3_CONTRACTS.positionManager, maxUint256)

        console.log("[v0] Approving token1...")
        await approveToken(params.token1, UNISWAP_V3_CONTRACTS.positionManager, maxUint256)

        // Step 2: Add liquidity via mint
        const liquidityPayload = generateAddLiquidityPayload(
          UNISWAP_V3_CONTRACTS.positionManager,
          params.token0,
          params.token1,
          params.fee,
          params.tickLower,
          params.tickUpper,
          params.amount0,
          params.amount1,
          userAddress,
        )

        console.log("[v0] Executing add liquidity transaction...")
        const result = await executeTransaction(liquidityPayload.data, liquidityPayload.to)
        console.log("[v0] Liquidity added successfully")
        return result
      } catch (err: any) {
        console.error("[v0] Add liquidity error:", err)
        throw err
      }
    },
    [executeTransaction, isConnected, approveToken, client?.universal.account],
  )

  const removeLiquidity = useCallback(
    async (params: RemoveLiquidityParams) => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        console.log("[v0] Removing liquidity:", params)

        // Get user address
        const userAddress = client?.universal.account as string
        if (!userAddress) {
          throw new Error("User address not available")
        }

        const amount0Min = params.amount0Min || "0"
        const amount1Min = params.amount1Min || "0"

        // Step 1: Decrease liquidity
        const decreasePayload = generateDecreaseLiquidityPayload(
          UNISWAP_V3_CONTRACTS.positionManager,
          params.tokenId,
          params.liquidity,
          amount0Min,
          amount1Min,
        )

        console.log("[v0] Executing decrease liquidity transaction...")
        await executeTransaction(decreasePayload.data, decreasePayload.to)
        console.log("[v0] Liquidity decreased successfully")

        // Step 2: Collect tokens
        const collectPayload = generateCollectPayload(
          UNISWAP_V3_CONTRACTS.positionManager,
          params.tokenId,
          userAddress,
        )

        console.log("[v0] Executing collect transaction...")
        const result = await executeTransaction(collectPayload.data, collectPayload.to)
        console.log("[v0] Tokens collected successfully")
        return result
      } catch (err: any) {
        console.error("[v0] Remove liquidity error:", err)
        throw err
      }
    },
    [executeTransaction, isConnected, client?.universal.account],
  )

  const collectFees = useCallback(
    async (tokenId: string | number) => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        console.log("[v0] Collecting fees for position:", tokenId)

        // Get user address
        const userAddress = client?.universal.account as string
        if (!userAddress) {
          throw new Error("User address not available")
        }

        const collectPayload = generateCollectPayload(
          UNISWAP_V3_CONTRACTS.positionManager,
          tokenId,
          userAddress,
        )

        console.log("[v0] Executing collect transaction...")
        const result = await executeTransaction(collectPayload.data, collectPayload.to)
        console.log("[v0] Fees collected successfully")
        return result
      } catch (err: any) {
        console.error("[v0] Collect fees error:", err)
        throw err
      }
    },
    [executeTransaction, isConnected, client?.universal.account],
  )

  return {
    loading,
    error,
    isConnected,
    approveToken,
    createPool,
    swap,
    addLiquidity,
    removeLiquidity,
    collectFees,
  }
}
