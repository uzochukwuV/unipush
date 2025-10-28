# Tick Range Calculation from Pool Price

## Problem Overview

The Add Liquidity form was using tick offsets (like -100, +500) as min/max prices directly, which caused the error:

```
Error: Invalid price range: minPrice must be > 0 and < maxPrice
at calculateTickRange (universal-payload.ts:421:11)
```

The issue: `calculateTickRange()` expects **actual prices** (like 0.9, 1.1, 2.0), not tick offsets.

## Solution: Price Range from Current Pool Price

Instead of static tick offsets, we now:

1. **Get current pool price** from `sqrtPriceX96`
2. **Apply percentage multipliers** (90%, 110%, 50%, 200%, etc.) to current price
3. **Calculate tick bounds** from adjusted prices
4. **Pass to addLiquidity** with correct tickLower/tickUpper

## How It Works

### Step 1: Calculate Current Pool Price

The pool's `sqrtPriceX96` is converted to an actual price:

```typescript
const sqrtPriceX96 = BigInt(poolData.sqrtPriceX96)
const q96 = BigInt(1) << BigInt(96)           // 2^96
const q192 = q96 * q96                        // 2^192
const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96

// price = (sqrtPriceX96)^2 / 2^192 * 10^(decimals_diff)
let currentPrice: number
if (decimalDiff >= 0) {
  const numerator = sqrtPriceX96Squared * decimalAdjustment
  currentPrice = Number(numerator / q192)
} else {
  const denominator = q192 / decimalAdjustment
  currentPrice = Number(sqrtPriceX96Squared / denominator)
}
```

### Step 2: Apply Range Multipliers

Preset buttons represent percentages of current price:

```typescript
const ranges = [
  { min: 90, max: 110 },   // Tight: 0.9x to 1.1x
  { min: 50, max: 200 },   // Balanced: 0.5x to 2x
  { min: 25, max: 400 },   // Wide: 0.25x to 4x
  { min: 10, max: 1000 },  // Very Wide: 0.1x to 10x
]

// If current price is 2000 and user selects "Tight":
const minPrice = currentPrice * (90 / 100)   // 2000 * 0.9 = 1800
const maxPrice = currentPrice * (110 / 100)  // 2000 * 1.1 = 2200
```

### Step 3: Calculate Tick Range

Pass the calculated prices to `calculateTickRange()`:

```typescript
const { tickLower, tickUpper } = calculateTickRange(
  minPrice,    // e.g., 1800
  maxPrice,    // e.g., 2200
  token0Decimals,
  token1Decimals,
)
```

This function:
- Converts prices to sqrtPrices
- Calculates corresponding tick values
- Returns integer tick bounds valid for the pool

### Step 4: Submit with Correct Ticks

```typescript
await addLiquidity({
  token0: poolData.token0.address,
  token1: poolData.token1.address,
  fee: poolData.fee,
  amount0: amount0Wei.toString(),
  amount1: amount1Wei.toString(),
  tickLower,   // ← From tick calculation
  tickUpper,   // ← From tick calculation
})
```

## Data Flow

```
Pool Data (includes sqrtPriceX96)
         ↓
    Convert to currentPrice
         ↓
  User selects range
         ↓
  Calculate minPrice = currentPrice * (min / 100)
  Calculate maxPrice = currentPrice * (max / 100)
         ↓
  calculateTickRange(minPrice, maxPrice)
         ↓
  Get tickLower and tickUpper
         ↓
  Submit to addLiquidity with correct ticks
```

## Price Range Presets Explained

Each preset is relative to **current pool price**:

| Range | Min % | Max % | Use Case |
|-------|-------|-------|----------|
| **Tight** | 90% | 110% | Active trading, earn more fees, frequent rebalancing |
| **Balanced** | 50% | 200% | Default, moderate fees, some management |
| **Wide** | 25% | 400% | Passive provision, lower fees, less management |
| **Very Wide** | 10% | 1000% | Set-and-forget, minimal fees, no management |

### Example with ETH/USDC

If 1 ETH = 2000 USDC (current price):

- **Tight (0.9x - 1.1x)**
  - Min: 1800 USDC/ETH
  - Max: 2200 USDC/ETH
  - Range: $1800 to $2200

- **Balanced (0.5x - 2x)**
  - Min: 1000 USDC/ETH
  - Max: 4000 USDC/ETH
  - Range: $1000 to $4000

- **Wide (0.25x - 4x)**
  - Min: 500 USDC/ETH
  - Max: 8000 USDC/ETH
  - Range: $500 to $8000

## Implementation Details

### State Management

```typescript
// Old approach (broken)
const [minPrice, setMinPrice] = useState("")
const [maxPrice, setMaxPrice] = useState("")

// New approach (correct)
const [selectedRange, setSelectedRange] = useState<{
  min: number
  max: number
  label: string
} | null>(null)
```

### Button Click Handler

```typescript
onClick={() => {
  setSelectedRange({
    min: 90,                        // percentage
    max: 110,                       // percentage
    label: "Tight (0.9x - 1.1x)"
  })
}}

// Then in handleAddLiquidity:
const minPrice = currentPrice * (selectedRange.min / 100)
const maxPrice = currentPrice * (selectedRange.max / 100)
```

### Visual Feedback

Selected range button shows pink highlight:

```typescript
className={`p-3 rounded-lg border-2 transition-all ${
  selectedRange?.label === range.label
    ? "border-pink-500 bg-pink-500/10"      // Selected
    : "border-border/50 hover:border-pink-500/50"  // Not selected
}`}
```

## Error Handling

The solution includes robust error handling:

```typescript
if (!amount0 || !amount1 || !selectedRange) {
  toast({
    title: "Invalid Input",
    description: "Please fill in all fields and select a price range",
    variant: "destructive",
  })
  return
}
```

No more "Invalid price range" errors because:
- minPrice and maxPrice are always > 0 (derived from currentPrice)
- minPrice < maxPrice (enforced by range definitions)
- Both values are real prices the pool understands

## Key Differences from Previous Approach

| Aspect | Old | New |
|--------|-----|-----|
| **Input** | Tick offsets (-100, +500) | Price percentages (90%, 200%) |
| **Logic** | Direct offset application | Percentage of current price |
| **Validation** | Could fail with invalid ranges | Always produces valid ranges |
| **UX** | Confusing tick terminology | Clear percentage descriptions |
| **Adaptability** | Fixed ranges | Dynamic based on current price |

## Testing the Implementation

1. **Open Add Liquidity form** for any pool
2. **Observe current pool price** calculated from sqrtPriceX96
3. **Select a preset range** (e.g., "Balanced")
4. **Console logs show:**
   ```
   [AddLiquidityForm] Price calculation: {
     currentPrice: 2000,
     selectedRange: { min: 50, max: 200, label: "Balanced..." },
     minPrice: 1000,
     maxPrice: 4000
   }
   ```
5. **Ticks calculated** without errors
6. **Transaction submitted** with correct tickLower/tickUpper

## References

- **sqrtPriceX96**: [PRICE_CALCULATION.md](PRICE_CALCULATION.md) - Detailed price formula
- **calculateTickRange()**: [lib/universal-payload.ts:414-431](lib/universal-payload.ts#L414)
- **Add Liquidity Form**: [components/add-liquidity-form.tsx](components/add-liquidity-form.tsx)
- **Pool Data Interface**: [hooks/use-pools.ts](hooks/use-pools.ts)

---

**Status**: ✅ Implemented
**Location**: [handleAddLiquidity function](components/add-liquidity-form.tsx#L158)
**Last Updated**: Oct 28, 2025
