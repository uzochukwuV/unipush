# Quick Reference Guide

## Token Configuration

### Import Tokens
```typescript
import { POPULAR_TOKENS, TOKENS_MAP, Token } from "@/lib/constants"
```

### Access Tokens
```typescript
// Use array
const allTokens = POPULAR_TOKENS

// Access by index
const wpc = POPULAR_TOKENS[0]
const pSol = POPULAR_TOKENS[1]
const pEth = POPULAR_TOKENS[2]
const usdt = POPULAR_TOKENS[3]

// Use map for quick lookup
const wpc = TOKENS_MAP.WPC
const usdt = TOKENS_MAP.USDT
```

## Pool Operations

### Import Pool Hook
```typescript
import { usePools } from "@/hooks/use-pools"
```

### Get All Pools
```typescript
const { getAllPools, pools, loading } = usePools()

// Fetch all pools
await getAllPools()

// Fetch specific token pairs + fees
await getAllPools(
  [TOKENS_MAP.WPC, TOKENS_MAP.USDT],
  [3000]
)
```

### Get Specific Pool
```typescript
const { getPool } = usePools()

const pool = await getPool(
  TOKENS_MAP.WPC.address,
  TOKENS_MAP.USDT.address,
  3000
)

if (pool) {
  console.log(`Pool at: ${pool.address}`)
  console.log(`Liquidity: ${pool.liquidity}`)
  console.log(`Price: ${pool.sqrtPriceX96}`)
}
```

## Uniswap V3 Operations

### Import Uniswap Hook
```typescript
import { useUniswapV3 } from "@/hooks/use-uniswap-v3"
```

### Create Pool
```typescript
const { createPool } = useUniswapV3()

await createPool(
  TOKENS_MAP.WPC.address,
  TOKENS_MAP.USDT.address,
  3000,           // fee
  2300,           // price ratio
  18,             // token0 decimals
  6               // token1 decimals
)
```

### Swap Tokens
```typescript
const { swap } = useUniswapV3()

await swap({
  tokenIn: TOKENS_MAP.WPC.address,
  tokenOut: TOKENS_MAP.USDT.address,
  fee: 3000,
  amountIn: ethers.parseUnits("100", 18),
  amountOutMinimum: "0", // Set slippage tolerance
  slippage: 0.5,
})
```

### Add Liquidity
```typescript
const { addLiquidity } = useUniswapV3()

await addLiquidity({
  token0: TOKENS_MAP.WPC.address,
  token1: TOKENS_MAP.USDT.address,
  fee: 3000,
  amount0: ethers.parseUnits("100", 18),
  amount1: ethers.parseUnits("230000", 6),
  tickLower: -887220,
  tickUpper: 887220,
})
```

### Remove Liquidity
```typescript
const { removeLiquidity } = useUniswapV3()

await removeLiquidity({
  tokenId: "12345",
  liquidity: "1000000000000000000",
})
```

### Collect Fees
```typescript
const { collectFees } = useUniswapV3()

await collectFees("12345") // position tokenId
```

## Token Details

| Symbol | Name | Address | Decimals |
|--------|------|---------|----------|
| WPC | Wrapped Push Coin | 0xE17...De9 | 18 |
| pSOL | Push SOL | 0x5D5...Bed | 18 |
| pETH | Push ETH | 0x297...809 | 18 |
| USDT | Tether USD | 0xCA0...d3 | 6 |

## Fee Tiers

| Tier | Fee | Use Case |
|------|-----|----------|
| 100 | 0.01% | Ultra-stable pairs |
| 500 | 0.05% | Stable pairs |
| 3000 | 0.3% | Most pairs |
| 10000 | 1% | Exotic/volatile pairs |

## Common Patterns

### Pool List Component
```typescript
export function PoolsList() {
  const { getAllPools, pools, loading } = usePools()

  useEffect(() => {
    getAllPools()
  }, [getAllPools])

  if (loading) return <div>Loading...</div>
  if (!pools.length) return <div>No pools</div>

  return (
    <div>
      {pools.map(pool => (
        <PoolCard key={pool.address} pool={pool} />
      ))}
    </div>
  )
}
```

### Pool Detail Component
```typescript
export function PoolDetail({ token0, token1, fee }: Props) {
  const { getPool, loading } = usePools()
  const [pool, setPool] = useState<PoolData | null>(null)

  useEffect(() => {
    getPool(token0, token1, fee).then(setPool)
  }, [token0, token1, fee, getPool])

  if (loading) return <div>Loading...</div>
  if (!pool) return <div>Pool not found</div>

  return (
    <Card>
      <h3>{pool.token0.symbol}/{pool.token1.symbol}</h3>
      <p>Fee: {pool.feePercentage}</p>
      <p>Liquidity: {pool.liquidity}</p>
    </Card>
  )
}
```

### Token Selector
```typescript
import { TokenSelector } from "@/components/token-selector"
import { POPULAR_TOKENS } from "@/lib/constants"

export function MyComponent() {
  const [token, setToken] = useState(POPULAR_TOKENS[0])

  return (
    <TokenSelector
      selectedToken={token}
      onSelectToken={setToken}
      tokens={POPULAR_TOKENS}
    />
  )
}
```

## Error Handling

```typescript
const { getPool, error } = usePools()

const pool = await getPool(token0, token1, fee)
if (error) {
  console.error("Failed to get pool:", error)
}
if (!pool) {
  console.warn("Pool does not exist")
}
```

## Tips & Tricks

1. **Token Ordering**: Always ensure token0 < token1 (automatic in hooks)
2. **Fee Selection**: Use 3000 (0.3%) for most pairs
3. **Slippage**: Set amountOutMinimum with 0.5-1% slippage tolerance
4. **Caching**: Store getAllPools() results to avoid repeated calls
5. **Type Safety**: Always use Token interface for token parameters

## Component File Locations

- Token Selection: `components/token-selector.tsx`
- Pool Display: `components/pool-card.tsx`
- Swap Interface: `components/swap-interface.tsx`
- Add Liquidity: `components/add-liquidity-form.tsx`
- Create Pool: `components/create-pool-dialog.tsx`

## Hook File Locations

- Pool Queries: `hooks/use-pools.ts`
- Uniswap Operations: `hooks/use-uniswap-v3.ts`
- Push Chain: `hooks/use-mobile.ts`, `hooks/use-toast.ts`

## Documentation Files

- Full Guide: `IMPLEMENTATION_SUMMARY.md`
- Pool Management: `POOL_MANAGEMENT.md`
- Uniswap Guide: `guide.md`

---

**Quick Links**:
- [Full Implementation](IMPLEMENTATION_SUMMARY.md)
- [Pool Management Guide](POOL_MANAGEMENT.md)
- [Uniswap V3 Guide](guide.md)
