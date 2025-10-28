import { ethers } from "ethers"

export interface UniversalPayload {
  to: string
  value: string
  data: string
  gasLimit: number
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  nonce: number
  deadline: number
  vType: number
}

export interface UniversalAccountId {
  chainNamespace: string
  chainId: string
  owner: string
}

/**
 * Generate UniversalPayload for Uniswap V3 operations
 * Added proper error handling and validation
 */
export function generateUniversalPayload(
  targetContract: string,
  calldata: string,
  gasLimit = 500000,
  value = "0x0",
  maxFeePerGas: string = ethers.parseUnits("20", "gwei").toString(),
  maxPriorityFeePerGas: string = ethers.parseUnits("2", "gwei").toString(),
): UniversalPayload {
  if (!ethers.isAddress(targetContract)) {
    throw new Error(`Invalid target contract address: ${targetContract}`)
  }

  if (!calldata.startsWith("0x")) {
    throw new Error("Calldata must start with 0x")
  }

  return {
    to: targetContract,
    value,
    data: calldata,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: 0,
    deadline: Math.floor(Date.now() / 1000) + 3600,
    vType: 0,
  }
}

/**
 * Generate payload for pool creation and initialization
 * Uses NonfungiblePositionManager.createAndInitializePoolIfNecessary
 * This creates and initializes the pool in a single atomic call
 */
export function generateCreatePoolPayload(
  positionManagerAddress: string,
  tokenA: string,
  tokenB: string,
  fee: number,
  sqrtPriceX96: string,
): UniversalPayload {
  if (!ethers.isAddress(tokenA) || !ethers.isAddress(tokenB)) {
    throw new Error("Invalid token addresses")
  }

  if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
    throw new Error("Cannot create pool with identical tokens")
  }

  // Ensure token0 < token1 (required by Uniswap V3)
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]

  const positionManager = new ethers.Contract(positionManagerAddress, [
    {
      inputs: [
        { name: "token0", type: "address" },
        { name: "token1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "sqrtPriceX96", type: "uint160" },
      ],
      name: "createAndInitializePoolIfNecessary",
      outputs: [{ name: "pool", type: "address" }],
      stateMutability: "payable",
      type: "function",
    },
  ])

  const calldata = positionManager.interface.encodeFunctionData("createAndInitializePoolIfNecessary", [
    token0,
    token1,
    fee,
    sqrtPriceX96,
  ])

  return generateUniversalPayload(positionManagerAddress, calldata, 500000)
}

/**
 * Generate payload for decreasing liquidity
 * Removes liquidity from an existing position
 */
export function generateDecreaseLiquidityPayload(
  positionManagerAddress: string,
  tokenId: string | number,
  liquidity: string,
  amount0Min: string = "0",
  amount1Min: string = "0",
): UniversalPayload {
  if (!ethers.isAddress(positionManagerAddress)) {
    throw new Error("Invalid position manager address")
  }

  const positionManager = new ethers.Contract(positionManagerAddress, [
    {
      inputs: [
        {
          components: [
            { name: "tokenId", type: "uint256" },
            { name: "liquidity", type: "uint128" },
            { name: "amount0Min", type: "uint256" },
            { name: "amount1Min", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
          name: "params",
          type: "tuple",
        },
      ],
      name: "decreaseLiquidity",
      outputs: [
        { name: "amount0", type: "uint256" },
        { name: "amount1", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ])

  const decreaseParams = {
    tokenId: tokenId.toString(),
    liquidity: liquidity,
    amount0Min: amount0Min,
    amount1Min: amount1Min,
    deadline: Math.floor(Date.now() / 1000) + 1200,
  }

  const calldata = positionManager.interface.encodeFunctionData("decreaseLiquidity", [decreaseParams])

  return generateUniversalPayload(positionManagerAddress, calldata, 300000)
}

/**
 * Generate payload for collecting fees and removed liquidity
 */
export function generateCollectPayload(
  positionManagerAddress: string,
  tokenId: string | number,
  recipient: string,
  amount0Max: string = "340282366920938463463374607431768211455", // MAX_UINT128
  amount1Max: string = "340282366920938463463374607431768211455", // MAX_UINT128
): UniversalPayload {
  if (!ethers.isAddress(positionManagerAddress)) {
    throw new Error("Invalid position manager address")
  }

  if (!ethers.isAddress(recipient)) {
    throw new Error("Invalid recipient address")
  }

  const positionManager = new ethers.Contract(positionManagerAddress, [
    {
      inputs: [
        {
          components: [
            { name: "tokenId", type: "uint256" },
            { name: "recipient", type: "address" },
            { name: "amount0Max", type: "uint128" },
            { name: "amount1Max", type: "uint128" },
          ],
          name: "params",
          type: "tuple",
        },
      ],
      name: "collect",
      outputs: [
        { name: "amount0", type: "uint256" },
        { name: "amount1", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ])

  const collectParams = {
    tokenId: tokenId.toString(),
    recipient: recipient,
    amount0Max: amount0Max,
    amount1Max: amount1Max,
  }

  const calldata = positionManager.interface.encodeFunctionData("collect", [collectParams])

  return generateUniversalPayload(positionManagerAddress, calldata, 200000)
}

/**
 * Generate payload for token approval
 */
export function generateApprovePayload(tokenAddress: string, spenderAddress: string, amount: string): UniversalPayload {
  if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(spenderAddress)) {
    throw new Error("Invalid token or spender address")
  }

  const token = new ethers.Contract(tokenAddress, [
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ])

  const calldata = token.interface.encodeFunctionData("approve", [spenderAddress, amount])

  return generateUniversalPayload(tokenAddress, calldata, 100000)
}

/**
 * Generate payload for single-hop swap
 * Fixed recipient and deadline handling
 */
export function generateSwapPayload(
  swapRouterAddress: string,
  tokenIn: string,
  tokenOut: string,
  fee: number,
  recipient: string,
  amountIn: string,
  amountOutMinimum: string,
): UniversalPayload {
  if (!ethers.isAddress(tokenIn) || !ethers.isAddress(tokenOut) || !ethers.isAddress(recipient)) {
    throw new Error("Invalid token or recipient address")
  }

  const swapRouter = new ethers.Contract(swapRouterAddress, [
    {
      inputs: [
        {
          components: [
            { name: "tokenIn", type: "address" },
            { name: "tokenOut", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "recipient", type: "address" },
            { name: "deadline", type: "uint256" },
            { name: "amountIn", type: "uint256" },
            { name: "amountOutMinimum", type: "uint256" },
            { name: "sqrtPriceLimitX96", type: "uint160" },
          ],
          name: "params",
          type: "tuple",
        },
      ],
      name: "exactInputSingle",
      outputs: [{ name: "amountOut", type: "uint256" }],
      stateMutability: "payable",
      type: "function",
    },
  ])

  const swapParams = {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline: Math.floor(Date.now() / 1000) + 300,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0,
  }

  console.log("Swap Params:", swapParams)

  const calldata = swapRouter.interface.encodeFunctionData("exactInputSingle", [swapParams])

  return generateUniversalPayload(swapRouterAddress, calldata, 300000)
}

/**
 * Generate payload for adding liquidity
 * Fixed token ordering and amount handling
 */
export function generateAddLiquidityPayload(
  positionManagerAddress: string,
  tokenA: string,
  tokenB: string,
  fee: number,
  tickLower: number,
  tickUpper: number,
  amountADesired: string,
  amountBDesired: string,
  recipient: string,
): UniversalPayload {
  if (!ethers.isAddress(tokenA) || !ethers.isAddress(tokenB) || !ethers.isAddress(recipient)) {
    throw new Error("Invalid token or recipient address")
  }

  // Ensure token0 < token1
  const [token0, token1, amount0Desired, amount1Desired] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB, amountADesired, amountBDesired]
      : [tokenB, tokenA, amountBDesired, amountADesired]

  const positionManager = new ethers.Contract(positionManagerAddress, [
    {
      inputs: [
        {
          components: [
            { name: "token0", type: "address" },
            { name: "token1", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "tickLower", type: "int24" },
            { name: "tickUpper", type: "int24" },
            { name: "amount0Desired", type: "uint256" },
            { name: "amount1Desired", type: "uint256" },
            { name: "amount0Min", type: "uint256" },
            { name: "amount1Min", type: "uint256" },
            { name: "recipient", type: "address" },
            { name: "deadline", type: "uint256" },
          ],
          name: "params",
          type: "tuple",
        },
      ],
      name: "mint",
      outputs: [
        { name: "tokenId", type: "uint256" },
        { name: "liquidity", type: "uint128" },
        { name: "amount0", type: "uint256" },
        { name: "amount1", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ])

  const mintParams = {
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient,
    deadline: Math.floor(Date.now() / 1000) + 1200,
  }

  const calldata = positionManager.interface.encodeFunctionData("mint", [mintParams])

  return generateUniversalPayload(positionManagerAddress, calldata, 800000)
}

/**
 * Calculate sqrtPriceX96 from price ratio
 * Formula: sqrt(price) * 2^96
 * Improved precision and error handling
 */
export function calculateSqrtPriceX96(priceRatio: number, token0Decimals: number, token1Decimals: number): string {
  if (priceRatio <= 0) {
    throw new Error("Price ratio must be positive")
  }

  try {
    // Convert human-readable price to base unit ratio
    const baseUnitRatio = (priceRatio * Math.pow(10, token1Decimals)) / Math.pow(10, token0Decimals)

    // Calculate sqrt(price) * 2^96
    const sqrtPrice = Math.sqrt(baseUnitRatio)
    const sqrtPriceX96 = sqrtPrice * Math.pow(2, 96)

    return BigInt(Math.floor(sqrtPriceX96)).toString()
  } catch (error) {
    throw new Error(`Failed to calculate sqrtPriceX96: ${error}`)
  }
}

/**
 * Calculate tick from sqrtPriceX96
 */
export function calculateTickFromSqrtPrice(sqrtPriceX96: string): number {
  try {
    const sqrtPrice = BigInt(sqrtPriceX96)
    const price = sqrtPrice * (sqrtPrice) / (BigInt(2) * BigInt(192))
    const tick = Math.log(Number.parseFloat(price.toString())) / Math.log(1.0001)
    return Math.round(tick)
  } catch (error) {
    throw new Error(`Failed to calculate tick: ${error}`)
  }
}

/**
 * Calculate tick range from price range
 * Added new utility for liquidity price range calculation
 */
export function calculateTickRange(
  minPrice: number,
  maxPrice: number,
  token0Decimals: number,
  token1Decimals: number,
): { tickLower: number; tickUpper: number } {
  if (minPrice <= 0 || maxPrice <= 0 || minPrice >= maxPrice) {
    throw new Error("Invalid price range: minPrice must be > 0 and < maxPrice")
  }

  const minSqrtPrice = Math.sqrt((minPrice * Math.pow(10, token1Decimals)) / Math.pow(10, token0Decimals))
  const maxSqrtPrice = Math.sqrt((maxPrice * Math.pow(10, token1Decimals)) / Math.pow(10, token0Decimals))

  const minTick = Math.floor(Math.log(minSqrtPrice) / Math.log(Math.sqrt(1.0001)))
  const maxTick = Math.ceil(Math.log(maxSqrtPrice) / Math.log(Math.sqrt(1.0001)))

  return { tickLower: minTick, tickUpper: maxTick }
}
