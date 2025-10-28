"use client"

import { useState, useCallback } from "react"
import { ethers } from "ethers"
import { UNISWAP_V3_CONTRACTS } from "@/lib/uniswap-v3-contracts"
import { POPULAR_TOKENS, Token, FEE_TIERS } from "@/lib/constants"
import { usePushChainClient } from "@pushchain/ui-kit"

export interface PoolData {
  address: string
  token0: Token
  token1: Token
  fee: number
  liquidity: string
  sqrtPriceX96: string
  tick: number
  feePercentage: string
}

export interface PoolListParams {
  tokens?: Token[]
  fees?: number[]
}

export function usePools() {
  const { pushChainClient: client, isInitialized: isConnected } = usePushChainClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pools, setPools] = useState<PoolData[]>([])

  /**
   * Get token by address
   */
  const getTokenByAddress = useCallback((address: string): Token | undefined => {
    return POPULAR_TOKENS.find((token) => token.address.toLowerCase() === address.toLowerCase())
  }, [])

  /**
   * Get all possible pools for given tokens and fees
   */
  const generatePoolCombinations = useCallback(
    (tokens: Token[] = POPULAR_TOKENS, fees: number[] = Object.values(FEE_TIERS)): PoolListParams[] => {
      const combinations: PoolListParams[] = []

      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          for (const fee of fees) {
            combinations.push({
              tokens: [tokens[i], tokens[j]],
              fees: [fee],
            })
          }
        }
      }

      return combinations
    },
    [],
  )

  /**
   * Get pool address from factory
   */
  const getPoolAddress = useCallback(
    async (token0: string, token1: string, fee: number): Promise<string | null> => {
      try {
        if (!client) {
          console.warn("[usePools] Push Chain client not initialized")
          return null
        }

        // Get provider from Push Chain client
        const provider = new ethers.JsonRpcProvider(
          'https://evm.rpc-testnet-donut-node1.push.org/'
        )

        const factory = new ethers.Contract(
          UNISWAP_V3_CONTRACTS.factory,
          [
            {
              inputs: [
                { name: "tokenA", type: "address" },
                { name: "tokenB", type: "address" },
                { name: "fee", type: "uint24" },
              ],
              name: "getPool",
              outputs: [{ name: "pool", type: "address" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          provider
        )

        // Ensure token0 < token1
        const [sortedToken0, sortedToken1] =
          token0.toLowerCase() < token1.toLowerCase() ? [token0, token1] : [token1, token0]

        console.log(`[usePools] Querying pool: ${sortedToken0} + ${sortedToken1} fee: ${fee}`)

        const poolAddress = await factory.getPool(sortedToken0, sortedToken1, fee)

        // Check if pool exists
        if (poolAddress === "0x0000000000000000000000000000000000000000") {
          console.log(`[usePools] Pool does not exist: ${sortedToken0}/${sortedToken1}`)
          return null
        }

        console.log(`[usePools] Found pool: ${poolAddress}`)
        return poolAddress
      } catch (err) {
        console.error("[usePools] Error getting pool address:", err)
        return null
      }
    },
    [client],
  )

  /**
   * Get pool state data (price, liquidity, tick)
   */
  const getPoolState = useCallback(
    async (poolAddress: string): Promise<Partial<PoolData> | null> => {
      try {
        if (!client) {
          console.warn("[usePools] Push Chain client not initialized")
          return null
        }

        // Get provider from Push Chain client
        const provider = new ethers.JsonRpcProvider(
          'https://evm.rpc-testnet-donut-node1.push.org/'
        )

        const pool = new ethers.Contract(
          poolAddress,
          [
            {
              name: "slot0",
              outputs: [
                { name: "sqrtPriceX96", type: "uint160" },
                { name: "tick", type: "int24" },
                { name: "observationIndex", type: "uint16" },
                { name: "observationCardinality", type: "uint16" },
                { name: "observationCardinalityNext", type: "uint16" },
                { name: "feeProtocol", type: "uint8" },
                { name: "unlocked", type: "bool" },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              name: "liquidity",
              outputs: [{ name: "", type: "uint128" }],
              stateMutability: "view",
              type: "function",
            },
            {
              name: "token0",
              outputs: [{ name: "", type: "address" }],
              stateMutability: "view",
              type: "function",
            },
            {
              name: "token1",
              outputs: [{ name: "", type: "address" }],
              stateMutability: "view",
              type: "function",
            },
            {
              name: "fee",
              outputs: [{ name: "", type: "uint24" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          provider
        )

        console.log(`[usePools] Fetching pool state for: ${poolAddress}`)

        const [slot0, liquidity, token0, token1, fee] = await Promise.all([
          pool.slot0(),
          pool.liquidity(),
          pool.token0(),
          pool.token1(),
          pool.fee(),
        ])

        const token0Data = getTokenByAddress(token0)
        const token1Data = getTokenByAddress(token1)

        if (!token0Data || !token1Data) {
          console.warn(`[usePools] Unknown tokens in pool: ${token0} / ${token1}`)
          return null
        }

        const poolData: Partial<PoolData> = {
          address: poolAddress,
          token0: token0Data,
          token1: token1Data,
          fee: Number(fee),
          liquidity: liquidity.toString(),
          sqrtPriceX96: slot0.sqrtPriceX96.toString(),
          tick: Number(slot0.tick),
          feePercentage: `${(BigInt(fee) / BigInt(10000)).toString()}%`,
        }

        console.log(`[usePools] Pool state fetched: ${poolData.token0?.symbol}/${poolData.token1?.symbol}`)

        return poolData
      } catch (err) {
        console.error("[usePools] Error getting pool state:", err)
        return null
      }
    },
    [client, getTokenByAddress]
  )

  /**
   * Get all pools for token pairs
   */
  const getAllPools = useCallback(
    async (tokens: Token[] = POPULAR_TOKENS, fees: number[] = Object.values(FEE_TIERS)): Promise<PoolData[]> => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        return []
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[usePools] Fetching all pools...")
        const foundPools: PoolData[] = []

        // Generate all token pair + fee combinations
        const combinations = generatePoolCombinations(tokens, fees)

        // Query each combination
        for (const combo of combinations) {
          if (!combo.tokens || !combo.fees) continue

          const [token0, token1] = combo.tokens
          const fee = combo.fees[0]

          // Get pool address
          const poolAddress = await getPoolAddress(token0.address, token1.address, fee)
          if (!poolAddress) continue

          // Get pool state
          const poolState = await getPoolState(poolAddress)
          if (!poolState) continue

          foundPools.push(poolState as PoolData)
        }

        console.log(`[usePools] Found ${foundPools.length} pools`)
        setPools(foundPools)
        return foundPools
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch pools"
        setError(errorMsg)
        console.error("[usePools] Error fetching pools:", err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [isConnected, generatePoolCombinations, getPoolAddress, getPoolState],
  )

  /**
   * Get specific pool data
   */
  const getPool = useCallback(
    async (token0: string, token1: string, fee: number): Promise<PoolData | null> => {
      if (!isConnected) {
        const errorMsg = "Wallet not connected"
        setError(errorMsg)
        return null
      }

      try {
        console.log("[usePools] Fetching pool:", token0, token1, fee)

        // Get pool address
        const poolAddress = await getPoolAddress(token0, token1, fee)
        if (!poolAddress) {
          setError("Pool not found")
          return null
        }

        // Get pool state
        const poolState = await getPoolState(poolAddress)
        if (!poolState) {
          setError("Failed to get pool state")
          return null
        }

        return poolState as PoolData
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch pool"
        setError(errorMsg)
        console.error("[usePools] Error fetching pool:", err)
        return null
      }
    },
    [isConnected, getPoolAddress, getPoolState],
  )

  /**
   * Get pool by pool address ID
   * Directly queries pool state from contract address
   */
  const getPoolByID = useCallback(
    async (poolAddress: string): Promise<PoolData | null> => {
      try {
        if (!poolAddress || !ethers.isAddress(poolAddress)) {
          console.warn("[usePools] Invalid pool address:", poolAddress)
          setError("Invalid pool address")
          return null
        }

        console.log(`[usePools] Fetching pool by ID: ${poolAddress}`)

        // Get pool state directly from address
        const poolState = await getPoolState(poolAddress)
        if (!poolState) {
          setError("Pool not found")
          return null
        }

        console.log(`[usePools] Pool found: ${poolState.token0?.symbol}/${poolState.token1?.symbol}`)

        return poolState as PoolData
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch pool by ID"
        setError(errorMsg)
        console.error("[usePools] Error fetching pool by ID:", err)
        return null
      }
    },
    [getPoolState],
  )

  return {
    loading,
    error,
    pools,
    isConnected,
    getAllPools,
    getPool,
    getPoolByID,
    getPoolAddress,
    getPoolState,
    getTokenByAddress,
    generatePoolCombinations,
  }
}
