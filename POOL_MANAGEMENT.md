# Pool Management & Token Configuration

## Overview

This document describes how to use the centralized token configuration and pool management utilities in the Uniswap V3 Push Chain application.

## Centralized Token Configuration

### Location
`lib/constants.ts`

### Token Interface
```typescript
export interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoUrl?: string
}
```

### Available Tokens
The application supports 4 popular tokens via `POPULAR_TOKENS` constant:

1. **WPC** - Wrapped Push Coin
   - Address: `0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9`
   - Decimals: 18

2. **pSOL** - Push SOL
   - Address: `0x5D525Df2bD99a6e7ec58b76aF2fd95F39874EBed`
   - Decimals: 18

3. **pETH** - Push ETH
   - Address: `0x2971824Db68229D087931155C2b8bB820B275809`
   - Decimals: 18

4. **USDT** - Tether USD
   - Address: `0xCA0C5E6F002A389E1580F0DB7cd06e4549B5F9d3`
   - Decimals: 6

### Using Tokens in Components

Instead of hardcoding token data, import from constants:

```typescript
import { POPULAR_TOKENS, Token, TOKENS_MAP } from "@/lib/constants"

// Use array
const tokens = POPULAR_TOKENS

// Access by symbol
const wpc = TOKENS_MAP.WPC
const pSol = TOKENS_MAP.pSOL
```

## Pool Management Hook

### Location
`hooks/use-pools.ts`

### Features

#### 1. Get All Pools
```typescript
const { getAllPools, pools, loading } = usePools()

// Fetch all pools for all token pairs and fees
const allPools = await getAllPools()

// Fetch pools for specific tokens and fees
const filteredPools = await getAllPools(
  [TOKENS_MAP.WPC, TOKENS_MAP.USDT],
  [3000] // 0.3% fee
)
```

#### 2. Get Specific Pool
```typescript
const { getPool } = usePools()

const poolData = await getPool(
  "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9", // token0 (WPC)
  "0xCA0C5E6F002A389E1580F0DB7cd06e4549B5F9d3", // token1 (USDT)
  3000 // fee
)
```

#### 3. Return Values

```typescript
interface PoolData {
  address: string                    // Pool contract address
  token0: Token                      // Token 0 data
  token1: Token                      // Token 1 data
  fee: number                        // Fee tier (100, 500, 3000, 10000)
  liquidity: string                  // Total liquidity in pool
  sqrtPriceX96: string              // Current price (sqrt format)
  tick: number                       // Current tick
  feePercentage: string             // Fee as percentage (e.g., "0.30%")
}
```

### API Methods

#### `getAllPools(tokens?, fees?)`
Fetches all possible pools for given tokens and fee tiers.

**Parameters:**
- `tokens` (optional): Array of Token objects. Defaults to POPULAR_TOKENS
- `fees` (optional): Array of fee tiers. Defaults to all supported fees

**Returns:** Promise<PoolData[]>

#### `getPool(token0, token1, fee)`
Fetches a specific pool's data.

**Parameters:**
- `token0`: Token 0 address (string)
- `token1`: Token 1 address (string)
- `fee`: Fee tier (number: 100, 500, 3000, or 10000)

**Returns:** Promise<PoolData | null>

#### `getPoolAddress(token0, token1, fee)`
Gets the pool contract address without full state data.

**Returns:** Promise<string | null>

#### `getPoolState(poolAddress)`
Fetches pool state (price, liquidity, tick) for a pool address.

**Returns:** Promise<Partial<PoolData> | null>

#### `getTokenByAddress(address)`
Finds a token by address from POPULAR_TOKENS.

**Parameters:**
- `address`: Token contract address (string)

**Returns:** Token | undefined

#### `generatePoolCombinations(tokens?, fees?)`
Generates all possible token pair + fee combinations.

**Returns:** PoolListParams[]

### State Management

```typescript
const {
  loading,           // Boolean - loading state
  error,             // String | null - error message if any
  pools,             // PoolData[] - cached pool list
  isConnected,       // Boolean - wallet connection status
} = usePools()
```

## Component Integration Examples

### Example 1: Display All Pools

```typescript
import { usePools } from "@/hooks/use-pools"
import { POPULAR_TOKENS } from "@/lib/constants"

export function PoolList() {
  const { getAllPools, pools, loading } = usePools()

  useEffect(() => {
    getAllPools()
  }, [])

  return (
    <div>
      {loading && <div>Loading pools...</div>}
      {pools.map(pool => (
        <div key={pool.address}>
          <h3>{pool.token0.symbol}/{pool.token1.symbol}</h3>
          <p>Fee: {pool.feePercentage}</p>
          <p>Liquidity: {pool.liquidity}</p>
        </div>
      ))}
    </div>
  )
}
```

### Example 2: Get Specific Pool

```typescript
import { usePools } from "@/hooks/use-pools"
import { TOKENS_MAP } from "@/lib/constants"

export function PoolDetail() {
  const { getPool, loading } = usePools()
  const [pool, setPool] = useState(null)

  const handleGetPool = async () => {
    const poolData = await getPool(
      TOKENS_MAP.WPC.address,
      TOKENS_MAP.USDT.address,
      3000
    )
    setPool(poolData)
  }

  return (
    <div>
      <button onClick={handleGetPool}>Get WPC/USDT Pool</button>
      {pool && (
        <div>
          <h3>{pool.token0.symbol}/{pool.token1.symbol}</h3>
          <p>Tick: {pool.tick}</p>
          <p>Price: {pool.sqrtPriceX96}</p>
        </div>
      )}
    </div>
  )
}
```

### Example 3: Using in Create Pool Dialog

```typescript
import { POPULAR_TOKENS, Token } from "@/lib/constants"
import { TokenSelector } from "@/components/token-selector"

export function CreatePoolDialog() {
  const [token0, setToken0] = useState<Token>(POPULAR_TOKENS[0])
  const [token1, setToken1] = useState<Token>(POPULAR_TOKENS[1])

  return (
    <div>
      <Label>Token 1</Label>
      <TokenSelector
        selectedToken={token0}
        onSelectToken={setToken0}
        tokens={POPULAR_TOKENS}
      />

      <Label>Token 2</Label>
      <TokenSelector
        selectedToken={token1}
        onSelectToken={setToken1}
        tokens={POPULAR_TOKENS}
      />
    </div>
  )
}
```

## Components Using Centralized Tokens

The following components have been updated to use `POPULAR_TOKENS` from constants:

1. **create-pool-dialog.tsx** - Pool creation dialog
2. **swap-interface.tsx** - Swap interface
3. **token-selector.tsx** - Token selection component
4. **add-liquidity-form.tsx** - Liquidity management form

## Adding New Tokens

To add a new token:

1. Update `lib/constants.ts`:

```typescript
export const POPULAR_TOKENS: Token[] = [
  // ... existing tokens
  {
    symbol: "newSymbol",
    name: "New Token",
    address: "0x...",
    decimals: 18,
    logoUrl: "/path/to/logo.svg",
  },
]

export const TOKENS_MAP = {
  // ... existing mappings
  newSymbol: POPULAR_TOKENS[4], // index of new token
}
```

2. The new token will automatically be available in:
   - All components using `POPULAR_TOKENS`
   - Pool querying via `usePools()`
   - Token selector dropdowns

## Fee Tiers

Supported fee tiers (from `lib/constants.ts`):

```typescript
export const FEE_TIERS = {
  LOWEST: 100,      // 0.01%
  LOW: 500,         // 0.05%
  MEDIUM: 3000,     // 0.3%
  HIGH: 10000,      // 1%
}
```

## Error Handling

All pool operations include error states:

```typescript
const { getPool, error } = usePools()

const pool = await getPool(token0, token1, fee)
if (error) {
  console.error("Pool fetch failed:", error)
}
```

Common errors:
- "Pool not found" - Pool doesn't exist for the token pair/fee
- "Failed to get pool state" - Could not fetch pool data
- "Wallet not connected" - User needs to connect wallet

## Best Practices

1. **Use Centralized Tokens**: Always import tokens from `lib/constants.ts` instead of hardcoding
2. **Validate Pool Existence**: Check for null returns from `getPool()`
3. **Handle Loading States**: Display loading indicators while fetching pools
4. **Cache Pool Data**: Store `getAllPools()` results to avoid repeated calls
5. **Use Type Safety**: Leverage the `Token` and `PoolData` interfaces

## Migration Guide

If you have hardcoded tokens elsewhere:

### Before
```typescript
const TOKENS = [
  {
    symbol: "WPC",
    address: "0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9",
    // ...
  }
]
```

### After
```typescript
import { POPULAR_TOKENS } from "@/lib/constants"

const tokens = POPULAR_TOKENS
```

---

**Last Updated**: 2024
**Version**: 1.0
