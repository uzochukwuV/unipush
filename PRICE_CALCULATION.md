# Price Calculation from sqrtPriceX96

## Overview

The Add Liquidity form automatically calculates Token B amount based on Token A input using the current pool price derived from `sqrtPriceX96`. This document explains the mathematical formula and implementation.

## What is sqrtPriceX96?

`sqrtPriceX96` is Uniswap V3's standard representation of price:
- **Definition**: Square root of the price, multiplied by 2^96
- **Formula**: `sqrtPriceX96 = sqrt(price) * 2^96`
- **Precision**: Integer representation stored on-chain to avoid floating-point issues
- **Source**: Retrieved from pool's `slot0()` function

## Converting sqrtPriceX96 to Price Ratio

To calculate how much Token B equals Token A, we need to convert sqrtPriceX96 back to a human-readable price.

### Mathematical Formula

Given:
- `sqrtPriceX96`: Current price representation from pool
- `token0Decimals`: Decimal places of Token A
- `token1Decimals`: Decimal places of Token B

**Step 1**: Calculate price from sqrtPriceX96
```
price = (sqrtPriceX96 / 2^96)²
     = (sqrtPriceX96)² / (2^192)
```

**Step 2**: Adjust for decimal differences
```
price_ratio = price * 10^(token1Decimals - token0Decimals)
```

**Step 3**: Calculate Token B amount
```
token_b_amount = token_a_amount * price_ratio
```

## Implementation in add-liquidity-form.tsx

### Code Structure

```typescript
const handleAmount0Change = (value: string) => {
  setAmount0(value)
  if (value && !isNaN(Number(value)) && poolData) {
    try {
      // 1. Convert sqrtPriceX96 string to BigInt
      const sqrtPriceX96 = BigInt(poolData.sqrtPriceX96)

      // 2. Square the sqrtPriceX96
      const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96

      // 3. Calculate 2^96 and 2^192 using bit shift
      const q96 = BigInt(1) << BigInt(96)  // 2^96
      const q192 = q96 * q96                // 2^192

      // 4. Calculate decimal adjustment
      const decimalDiff = poolData.token1.decimals - poolData.token0.decimals
      let decimalAdjustment = BigInt(1)
      for (let i = 0; i < Math.abs(decimalDiff); i++) {
        decimalAdjustment *= BigInt(10)
      }

      // 5. Calculate price ratio considering decimal difference
      let priceRatio: number
      if (decimalDiff >= 0) {
        const numerator = sqrtPriceX96Squared * decimalAdjustment
        priceRatio = Number(numerator / q192)
      } else {
        const denominator = q192 / decimalAdjustment
        priceRatio = Number(sqrtPriceX96Squared / denominator)
      }

      // 6. Calculate and set Token B amount
      const amount1Value = Number(value) * priceRatio
      setAmount1(amount1Value.toFixed(poolData.token1.decimals))
    } catch (err) {
      console.error("Error calculating price from sqrtPriceX96:", err)
      setAmount1(value) // Fallback to 1:1
    }
  } else {
    setAmount1("")
  }
}
```

## Why BigInt?

Using `BigInt` is critical for precision:
- **sqrtPriceX96** values are very large (256-bit numbers)
- Squaring them produces extremely large numbers (512-bit)
- JavaScript's `Number` type (64-bit IEEE 754) cannot accurately represent these values
- `BigInt` provides arbitrary-precision arithmetic without loss of precision
- Final result is converted to `Number` only after division (when value is manageable)

## Decimal Adjustment Explanation

Different tokens have different decimal places:
- **USDC**: 6 decimals
- **ETH**: 18 decimals
- **USDT**: 6 decimals

When calculating price, we must account for this difference:

**Example**: ETH/USDC pool
- Token0: ETH (18 decimals)
- Token1: USDC (6 decimals)
- If sqrtPriceX96 represents 2000 (1 ETH = 2000 USDC)
- decimal adjustment = 10^(6-18) = 10^-12
- The formula naturally handles this in the division

## Error Handling

The implementation includes try-catch for robustness:
- Invalid sqrtPriceX96 strings → caught and logged
- Fallback: uses 1:1 ratio if calculation fails
- User sees at least something calculated instead of empty field

## Integration with UI

In the Add Liquidity Form:
1. User enters Token A amount
2. `handleAmount0Change()` is triggered
3. Token B amount is auto-calculated and displayed read-only
4. "Auto" badge shows Token B is calculated
5. User can use "Max" button to fill Token A with their balance
6. Both values must be approved and validated before submission

## Data Flow

```
Pool Detail Page
    ↓
Passes poolId to Add Liquidity Form
    ↓
Form fetches pool data via getPoolByID()
    ↓
sqrtPriceX96 received from pool contract
    ↓
User enters Token A amount
    ↓
handleAmount0Change() calculates Token B
    ↓
Price calculation from sqrtPriceX96 ← YOU ARE HERE
    ↓
Token B amount displayed to user
    ↓
User clicks "Add Liquidity"
    ↓
Submit with calculated amounts
```

## Testing the Calculation

To verify the calculation works correctly:

1. **Known pool example**: Create a pool with known price (e.g., 1 ETH = 2000 USDC)
2. **Enter amount**: Type "1" in Token A (ETH)
3. **Verify output**: Token B should show "2000" (USDC)
4. **Check console**: Logs show price_ratio and intermediate calculations

## Reference

- **Uniswap V3 Docs**: Price and sqrtPriceX96 encoding
- **Pool Contract**: `slot0()` returns current sqrtPriceX96
- **Backend pool-manager.js**: Uses `calculateSqrtPriceX96Precise()` to create pools
- **Add Liquidity Form**: [components/add-liquidity-form.tsx](components/add-liquidity-form.tsx#L105-L157)

---

**Status**: ✅ Implemented
**Location**: [handleAmount0Change function](components/add-liquidity-form.tsx#L105)
**Last Updated**: Oct 28, 2025
