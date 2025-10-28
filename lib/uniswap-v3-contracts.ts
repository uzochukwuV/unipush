export const UNISWAP_V3_CONTRACTS = {
  factory: "0x81b8Bca02580C7d6b636051FDb7baAC436bFb454",
  WPC: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
  swapRouter: "0x5D548bB9E305AAe0d6dc6e6fdc3ab419f6aC0037",
  positionManager: "0xf9b3ac66aed14A2C7D9AA7696841aB6B27a6231e",
  quoterV2: "0x83316275f7C2F79BC4E26f089333e88E89093037",
  tickLens: "0xb64113Fc16055AfE606f25658812EE245Aa41dDC",
  multicall: "0xa8c00017955c8654bfFbb6d5179c99f5aB8B7849",
}

// Production pools configuration
export const PRODUCTION_POOLS = {
  pSOL_WPC_500: {
    name: "pSOL/WPC Pool",
    address: "0x0E5914e3A7e2e6d18330Dd33fA387Ce33Da48b54",
    token0: "0x5D525Df2bD99a6e7ec58b76aF2fd95F39874EBed",
    token1: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
    token0Symbol: "pSOL",
    token1Symbol: "WPC",
    fee: 500,
    feePercentage: "0.05%",
    priceRatio: 2300,
    sqrtPriceX96: "120155457601348120190674128169310594",
    currentTick: "284653",
  },
  pETH_WPC_500: {
    name: "pETH/WPC Pool",
    address: "0x012d5C099f8AE00009f40824317a18c3A342f622",
    token0: "0x2971824Db68229D087931155C2b8bB820B275809",
    token1: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
    token0Symbol: "pETH",
    token1Symbol: "WPC",
    fee: 500,
    feePercentage: "0.05%",
    priceRatio: 40000,
    sqrtPriceX96: "15845632502852867518708790067200",
    currentTick: "105971",
  },
  USDT_WPC_500: {
    name: "USDT/WPC Pool",
    address: "0x2d46b2b92266f34345934F17039768cd631aB026",
    token0: "0xCA0C5E6F002A389E1580F0DB7cd06e4549B5F9d3",
    token1: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
    token0Symbol: "USDT",
    token1Symbol: "WPC",
    fee: 500,
    feePercentage: "0.05%",
    priceRatio: 10,
    sqrtPriceX96: "250541448375047931186413801569606323",
    currentTick: "299351",
  },
  USDC_WPC_500: {
    name: "USDC.eth/WPC Pool",
    address: "0x69B21660F49f2B8F60B0177Abc751a08EBEa0Ae3",
    token0: "0x387b9C8Db60E74999aAAC5A2b7825b400F12d68E",
    token1: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
    token0Symbol: "USDC.eth",
    token1Symbol: "WPC",
    fee: 500,
    feePercentage: "0.05%",
    priceRatio: 10,
    sqrtPriceX96: "250541448375047931186413801569606323",
    currentTick: "299351",
  },
}

// Uniswap V3 Factory ABI (minimal)
export const FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    name: "createPool",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
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
]

// Uniswap V3 Pool ABI (minimal)
export const POOL_ABI = [
  {
    inputs: [{ name: "sqrtPriceX96", type: "uint160" }],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
    name: "fee",
    outputs: [{ name: "", type: "uint24" }],
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
]

// Swap Router ABI (minimal)
export const SWAP_ROUTER_ABI = [
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
]

// Position Manager ABI (minimal)
export const POSITION_MANAGER_ABI = [
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
]

// ERC20 ABI (minimal)
export const ERC20_ABI = [
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
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]
