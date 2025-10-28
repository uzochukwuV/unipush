// Push Chain Configuration
export const PUSH_CHAIN_CONFIG = {
  TESTNET_RPC: "https://evm.rpc-testnet-donut-node1.push.org/",
  MAINNET_RPC: "https://evm.rpc-mainnet.push.org/",
  NETWORK: "testnet" as const,
}

// Uniswap V3 Contract Addresses (Deploy these to Push Chain)
export const UNISWAP_CONTRACTS = {
  FACTORY: "0xdF216d8a65eecAcA7E96D57b8C51cD1713b2dFbA", // Replace with your deployed address
  SWAP_ROUTER: "0x11a047224eB5632E69191fD40cE2a1419903ee6b", // Replace with your deployed address
  POSITION_MANAGER: "0x42c9D8A4BE1Ca4381772DcDCC4e895FafE01aC1F", // Replace with your deployed address
  QUOTER: "0x8E7c0E4f8439988F10e0016deA08e21FEa4204d2", // Replace with your deployed address
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
// Token Addresses on Push Chain
export interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoUrl?: string
}

export const POPULAR_TOKENS: Token[] = [
  {
    symbol: "WPC",
    name: "Wrapped Push Coin",
    address: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
    decimals: 18,
    logoUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    symbol: "pSOL",
    name: "Push SOL",
    address: "0x5D525Df2bD99a6e7ec58b76aF2fd95F39874EBed",
    decimals: 18,
    logoUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    symbol: "pETH",
    name: "Push ETH",
    address: "0x2971824Db68229D087931155C2b8bB820B275809",
    decimals: 18,
    logoUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xCA0C5E6F002A389E1580F0DB7cd06e4549B5F9d3",
    decimals: 6,
    logoUrl: "/placeholder.svg?height=32&width=32",
  },
]

export const TOKENS_MAP = {
  WPC: POPULAR_TOKENS[0],
  pSOL: POPULAR_TOKENS[1],
  pETH: POPULAR_TOKENS[2],
  USDT: POPULAR_TOKENS[3],
}

// Fee Tiers
export const FEE_TIERS = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
}

// Supported Chains for Universal Transactions
export const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum", icon: "⟠" },
  { id: 137, name: "Polygon", icon: "⬡" },
  { id: 8453, name: "Base", icon: "🔵" },
  { id: 11155111, name: "Sepolia", icon: "⟠" },
  { id: "solana", name: "Solana", icon: "◎" },
]
