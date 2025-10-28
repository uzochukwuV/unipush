export const UNISWAP_V3_CONTRACTS = {
  factory: "0xdF216d8a65eecAcA7E96D57b8C51cD1713b2dFbA",
  WPC: "0x4200000000000000000000000000000000000006",
  swapRouter: "0x11a047224eB5632E69191fD40cE2a1419903ee6b",
  positionManager: "0x42c9D8A4BE1Ca4381772DcDCC4e895FafE01aC1F",
  quoterV2: "0x8E7c0E4f8439988F10e0016deA08e21FEa4204d2",
  tickLens: "0x3C80e3c4Ad3425CE9106D42d8dC241AB23d0f649",
  multicall: "0xa8c00017955c8654bfFbb6d5179c99f5aB8B7849",
}


const address =  {
  factory: '0xdF216d8a65eecAcA7E96D57b8C51cD1713b2dFbA',
  owner: '0x8AaEe2071A400cC60927e46D53f751e521ef4D35',
  contracts: {
  "factory": "0xdF216d8a65eecAcA7E96D57b8C51cD1713b2dFbA",
  "weth9": "0x4200000000000000000000000000000000000006",
  "tickLens": "0x3C80e3c4Ad3425CE9106D42d8dC241AB23d0f649",
  "quoter": "0x8E7c0E4f8439988F10e0016deA08e21FEa4204d2",
  "swapRouter": "0x11a047224eB5632E69191fD40cE2a1419903ee6b",
  "nftDescriptor": "0x8AcefAE169a8507D6Ed9A8004812929B4D3eABa9",
  "positionDescriptor": "0xcC9610131efBF0fA943C3c0FB63B0e00a2c2eA5B",
  "positionManager": "0x42c9D8A4BE1Ca4381772DcDCC4e895FafE01aC1F",
  "v3Migrator": "0xF855FC9C28b5116e3Ac467aD0Fc0AfC589AC019D"
}
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
