"use client"

import { useState, useCallback, useEffect } from "react"
import { ethers } from "ethers"
import { UNISWAP_V3_CONTRACTS } from "@/lib/uniswap-v3-contracts"
import { usePushChainClient } from "@pushchain/ui-kit"
import { POPULAR_TOKENS, Token } from "@/lib/constants"

export interface Position {
  id: string
  poolId: string
  token0: Token
  token1: Token
  fee: number
  liquidity: string
  minPrice: string
  maxPrice: string
  currentPrice: string
  inRange: boolean
  uncollectedFees0: string
  uncollectedFees1: string
  totalValue: string
  pnl: number
}

export interface PositionData {
  tokenId: string
  operator: string
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: string
  feeGrowthInside0LastX128: string
  feeGrowthInside1LastX128: string
  tokensOwed0: string
  tokensOwed1: string
}

export function usePositions() {
  const { pushChainClient: client, isInitialized: isConnected } = usePushChainClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [positions, setPositions] = useState<Position[]>([])

  /**
   * Get token by address
   */
  const getTokenByAddress = useCallback((address: string): Token | undefined => {
    return POPULAR_TOKENS.find((token) => token.address.toLowerCase() === address.toLowerCase())
  }, [])

  /**
   * Get user's position NFTs from PositionManager
   */
  const getUserPositions = useCallback(async (walletAddress: string): Promise<PositionData[]> => {
    try {
      if (!client) {
        console.warn("[usePositions] Push Chain client not initialized")
        return []
      }

      const provider = new ethers.JsonRpcProvider(
        'https://evm.rpc-testnet-donut-node1.push.org/'
      )

      // Create PositionManager contract instance
      const positionManager = new ethers.Contract(
        UNISWAP_V3_CONTRACTS.positionManager,
        [
          {
            name: "balanceOf",
            inputs: [{ name: "owner", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            name: "tokenByIndex",
            inputs: [
              { name: "owner", type: "address" },
              { name: "index", type: "uint256" },
            ],
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            name: "positions",
            inputs: [{ name: "tokenId", type: "uint256" }],
            outputs: [
              { name: "nonce", type: "uint96" },
              { name: "operator", type: "address" },
              { name: "token0", type: "address" },
              { name: "token1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickLower", type: "int24" },
              { name: "tickUpper", type: "int24" },
              { name: "liquidity", type: "uint128" },
              { name: "feeGrowthInside0LastX128", type: "uint256" },
              { name: "feeGrowthInside1LastX128", type: "uint256" },
              { name: "tokensOwed0", type: "uint128" },
              { name: "tokensOwed1", type: "uint128" },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        provider
      )

      // Get number of positions
      const balance = await positionManager.balanceOf(walletAddress)
      console.log(`[usePositions] User has ${balance} positions`)

      if (balance === 0n) {
        return []
      }

      // Fetch all position IDs
      const positionIds: bigint[] = []
      for (let i = 0n; i < balance; i++) {
        const tokenId = await positionManager.tokenByIndex(walletAddress, i)
        positionIds.push(tokenId)
      }

      // Fetch position details for each ID
      const positionDataList: PositionData[] = []
      for (const tokenId of positionIds) {
        const posData = await positionManager.positions(tokenId)

        positionDataList.push({
          tokenId: tokenId.toString(),
          operator: posData.operator,
          token0: posData.token0,
          token1: posData.token1,
          fee: posData.fee,
          tickLower: posData.tickLower,
          tickUpper: posData.tickUpper,
          liquidity: posData.liquidity.toString(),
          feeGrowthInside0LastX128: posData.feeGrowthInside0LastX128.toString(),
          feeGrowthInside1LastX128: posData.feeGrowthInside1LastX128.toString(),
          tokensOwed0: posData.tokensOwed0.toString(),
          tokensOwed1: posData.tokensOwed1.toString(),
        })
      }

      console.log(`[usePositions] Fetched ${positionDataList.length} position details`)
      return positionDataList
    } catch (err) {
      console.error("[usePositions] Error fetching user positions:", err)
      throw err
    }
  }, [client])

  /**
   * Convert position data to display format
   */
  const transformPositionData = useCallback(
    (posData: PositionData, index: number): Position | null => {
      try {
        const token0 = getTokenByAddress(posData.token0)
        const token1 = getTokenByAddress(posData.token1)

        if (!token0 || !token1) {
          console.warn(`[usePositions] Unknown tokens: ${posData.token0} / ${posData.token1}`)
          return null
        }

        // Parse liquidity
        const liquidity = BigInt(posData.liquidity)
        const liquidityNum = Number(liquidity) / 1e18

        // Estimate min/max prices based on tick range
        // For simplification, we calculate based on tick-to-price formula
        const minPrice = (posData.tickLower / 100).toFixed(2)
        const maxPrice = (posData.tickUpper / 100).toFixed(2)
        const currentPrice = ((posData.tickLower + posData.tickUpper) / 200).toFixed(2)

        // Check if position is in range
        const currentTick = Math.floor((Number(minPrice) + Number(maxPrice)) / 2)
        const inRange = currentTick >= posData.tickLower && currentTick <= posData.tickUpper

        // Parse uncollected fees
        const fees0 = Number(BigInt(posData.tokensOwed0)) / Math.pow(10, token0.decimals)
        const fees1 = Number(BigInt(posData.tokensOwed1)) / Math.pow(10, token1.decimals)

        // Estimate total value (rough calculation)
        const estimatedValue = liquidityNum * 100
        const totalValue = `$${estimatedValue.toFixed(2)}`

        // Calculate PnL (mock calculation for now)
        const pnl = (Math.random() - 0.5) * 20

        return {
          id: posData.tokenId,
          poolId: `${token0.symbol}/${token1.symbol}`,
          token0,
          token1,
          fee: posData.fee / 10000, // Convert from bps to percentage
          liquidity: `${liquidityNum.toFixed(2)} LP Tokens`,
          minPrice,
          maxPrice,
          currentPrice,
          inRange,
          uncollectedFees0: fees0.toFixed(6),
          uncollectedFees1: fees1.toFixed(6),
          totalValue,
          pnl: parseFloat(pnl.toFixed(2)),
        }
      } catch (err) {
        console.error(`[usePositions] Error transforming position ${index}:`, err)
        return null
      }
    },
    [getTokenByAddress]
  )

  /**
   * Fetch all positions for connected wallet
   */
  const getAllPositions = useCallback(async (): Promise<Position[]> => {
    if (!isConnected) {
      const errorMsg = "Wallet not connected"
      setError(errorMsg)
      return []
    }

    setLoading(true)
    setError(null)

    try {
      if (!client) {
        throw new Error("Push Chain client not initialized")
      }

      const signer = client.getSigner()
      const walletAddress = await signer.getAddress()

      console.log(`[usePositions] Fetching positions for ${walletAddress}`)

      const positionDataList = await getUserPositions(walletAddress)

      if (positionDataList.length === 0) {
        console.log("[usePositions] No positions found")
        setPositions([])
        return []
      }

      // Transform all position data
      const transformedPositions = positionDataList
        .map((posData, index) => transformPositionData(posData, index))
        .filter((pos) => pos !== null) as Position[]

      console.log(`[usePositions] Transformed ${transformedPositions.length} positions`)

      setPositions(transformedPositions)
      return transformedPositions
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch positions"
      setError(errorMsg)
      console.error("[usePositions] Error fetching positions:", err)
      return []
    } finally {
      setLoading(false)
    }
  }, [isConnected, client, getUserPositions, transformPositionData])

  /**
   * Fetch position by ID
   */
  const getPosition = useCallback(
    async (tokenId: string): Promise<Position | null> => {
      if (!isConnected) {
        setError("Wallet not connected")
        return null
      }

      try {
        if (!client) {
          throw new Error("Push Chain client not initialized")
        }

        const provider = new ethers.JsonRpcProvider(
          'https://evm.rpc-testnet-donut-node1.push.org/'
        )

        const positionManager = new ethers.Contract(
          UNISWAP_V3_CONTRACTS.positionManager,
          [
            {
              name: "positions",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [
                { name: "nonce", type: "uint96" },
                { name: "operator", type: "address" },
                { name: "token0", type: "address" },
                { name: "token1", type: "address" },
                { name: "fee", type: "uint24" },
                { name: "tickLower", type: "int24" },
                { name: "tickUpper", type: "int24" },
                { name: "liquidity", type: "uint128" },
                { name: "feeGrowthInside0LastX128", type: "uint256" },
                { name: "feeGrowthInside1LastX128", type: "uint256" },
                { name: "tokensOwed0", type: "uint128" },
                { name: "tokensOwed1", type: "uint128" },
              ],
              stateMutability: "view",
              type: "function",
            },
          ],
          provider
        )

        const posData = await positionManager.positions(tokenId)

        const positionData: PositionData = {
          tokenId,
          operator: posData.operator,
          token0: posData.token0,
          token1: posData.token1,
          fee: posData.fee,
          tickLower: posData.tickLower,
          tickUpper: posData.tickUpper,
          liquidity: posData.liquidity.toString(),
          feeGrowthInside0LastX128: posData.feeGrowthInside0LastX128.toString(),
          feeGrowthInside1LastX128: posData.feeGrowthInside1LastX128.toString(),
          tokensOwed0: posData.tokensOwed0.toString(),
          tokensOwed1: posData.tokensOwed1.toString(),
        }

        return transformPositionData(positionData, 0)
      } catch (err) {
        console.error("[usePositions] Error fetching position:", err)
        return null
      }
    },
    [isConnected, client, transformPositionData]
  )

  return {
    loading,
    error,
    positions,
    getAllPositions,
    getPosition,
    getUserPositions,
  }
}
