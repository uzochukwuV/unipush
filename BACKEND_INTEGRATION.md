# Backend Pool Manager Integration Guide

## Overview

The `push-swap/scripts/pool-manager.js` file provides comprehensive backend utilities for managing Uniswap V3 pools on Push Chain. This document maps the backend functions to the frontend we've built.

## Backend Functions Summary

### 1. **Token Deployment** 🪙
```bash
node pool-manager.js deploy-tokens pETH "Push ETH" 18 1000000 pUSDC "Push USDC" 6 10000000
```
- Deploys PRC20 tokens
- Mints initial supply to deployer
- Saves addresses to `test-addresses.json`

**Used by**: Initial setup, testing new token pairs

---

### 2. **Pool Creation** 🏊
```bash
node pool-manager.js create-pool <token0Address> <token1Address> <priceRatio> [fee] [addLiquidity] [amount0] [amount1]
```

**Example**:
```bash
node pool-manager.js create-pool 0x5D525Df2bD99a6e7ec58b76aF2fd95F39874EBed 0xE17DD2E0509f99E9ee9469Cf6634048Ec5a3ADe9 2300 3000 true 1000 1000
```

**Flow**:
1. ✅ Sorts tokens (token0 < token1 lexicographically)
2. ✅ Calculates sqrtPriceX96 from human-readable price ratio
3. ✅ Creates pool via Factory
4. ✅ Initializes with calculated price
5. ✅ Optionally adds initial liquidity
6. ✅ Saves pool info to `test-addresses.json`

**Features**:
- Price ratio meaning: `1 token0 = priceRatio token1`
- Handles token ordering automatically
- Validates price ratios aren't extreme
- Creates readable pool keys in JSON: `ETH_USDC_3000`

---

### 3. **Add Liquidity** 💰
```bash
node pool-manager.js add-liquidity <poolAddress> <token0Address> <token1Address> <amount0> <amount1>
```

**What it does**:
1. ✅ Gets user token balances
2. ✅ Safe approves tokens to PositionManager
3. ✅ Calculates dynamic tick range based on current tick
4. ✅ Mints position NFT with liquidity
5. ✅ Returns position tokenId

**Tick Range Logic**:
- Fee tier 500: range = ±2000 ticks
- Fee tier 3000: range = ±5000 ticks
- Fee tier 10000: range = ±10000 ticks

---

### 4. **Swap** 🔄
```bash
node pool-manager.js swap <poolAddress> <tokenInAddress> <tokenOutAddress> <amountIn>
```

**What it does**:
1. ✅ Validates token balances
2. ✅ Safe approves input token to SwapRouter
3. ✅ Executes `exactInputSingle`
4. ✅ Calculates exchange rate
5. ✅ Validates output amount

---

### 5. **Full-Range Liquidity** 🎯
```bash
node pool-manager.js add-liquidity-full-range <poolAddress> <token0Address> <token1Address> <amount0> <amount1>
```

**Special use case**: Provides liquidity across all possible prices (-887272 to 887272 ticks)
- Useful for passive liquidity provision
- Covers all price ranges but earns fewer fees

---

### 6. **Get WPC** 💎
```bash
node pool-manager.js get-WPC [amount]
```

Deposits PUSH token to get WPC (wrapped PUSH)

---

## Frontend Integration Points

### Current Frontend Implementation

| Frontend Page | Backend Function | Status |
|---|---|---|
| **Pools Page** | `createPool()` | Via button links to add-liquidity |
| **Pool Detail** | `getPool()` (read-only) | ✅ Implemented via usePools hook |
| **Add Liquidity Form** | `addLiquidityToPool()` | ✅ Ready via useUniswapV3 hook |
| **Swap Interface** | `performSwap()` | ✅ Ready via useUniswapV3 hook |

### Missing Integrations

1. **Token Deployment UI** - Currently command-line only
2. **Token Balance Queries** - Partially (uses balanceOf directly)
3. **Full-range Liquidity Option** - Not in UI yet

---

## How They Work Together

### Swap Flow (Frontend → Backend)
```
User Interface (swap-interface.tsx)
    ↓
useUniswapV3.swap()
    ↓
SwapRouter.exactInputSingle()
    ↓
On-chain Execution
    ↓
performSwap() (validates & logs)
```

### Add Liquidity Flow (Frontend → Backend)
```
Add Liquidity Form (add-liquidity-form.tsx)
    ↓
useUniswapV3.addLiquidity()
    ↓
PositionManager.mint()
    ↓
Position NFT Created
    ↓
addLiquidityToPool() (validates & logs)
```

### Pool Discovery Flow (Frontend)
```
Pools Page (app/pools/page.tsx)
    ↓
usePools.getAllPools()
    ↓
Query Factory for all pools
    ↓
getPoolState() for each pool
    ↓
Display pools (no backend script needed)
```

---

## Key Backend Features

### 1. **Precise Price Calculation**
Uses BigNumber.js for high-precision sqrtPriceX96 calculation:
```javascript
// Human-readable: 1 ETH = 2300 USDC
// Calculates: sqrtPriceX96 for pool initialization
const sqrtPriceX96 = calculateSqrtPriceX96Precise(2300, 18, 6)
```

### 2. **Token Sorting**
Automatically handles token ordering:
```javascript
// Input: (pETH, USDC)
// Output: (pETH, USDC) - correct order if pETH < USDC
// OR: (USDC, pETH) - reversed if USDC < pETH
```

### 3. **Safe Approval**
Checks existing allowance before approving:
```javascript
// Only approves if current allowance < required amount
// Approves MaxUint256 to avoid future re-approvals
```

### 4. **Dynamic Tick Ranges**
Calculates optimal ranges based on:
- Current tick
- Fee tier
- Tick spacing

---

## Testing Workflow

### Full Integration Test
```bash
# 1. Deploy test tokens
node pool-manager.js deploy-tokens pETH "Push ETH" 18 1000000 USDT "Tether USD" 6 10000000

# 2. Create pool (from test-addresses.json)
node pool-manager.js create-pool 0x... 0x... 2300 3000 true 1000 1000

# 3. Add more liquidity
node pool-manager.js add-liquidity 0xPoolAddr 0x... 0x... 500 500

# 4. Perform swap via frontend
# (Or use CLI: node pool-manager.js swap 0xPool... 0x... 0x... 100)

# 5. View results in test-addresses.json
cat test-addresses.json
```

---

## Next Steps for Full Integration

### Priority 1: API Wrapper
Create `/pages/api/pool/` endpoints to call backend functions:
```typescript
// pages/api/pool/create.ts
export default async function handler(req, res) {
  const { token0, token1, priceRatio, fee } = req.body
  const poolAddress = await createPool(token0, token1, priceRatio, fee)
  res.status(200).json({ poolAddress })
}
```

### Priority 2: Pool Creation UI
Add form to create pools from frontend (currently only possible via CLI)

### Priority 3: Full-Range Liquidity Option
Add toggle in add-liquidity-form to use full-range instead of calculated range

### Priority 4: Analytics
Track and display:
- Total volume from swaps
- Total fees collected
- Historical trades
- Position performance

---

## File References

**Backend**:
- Script: `push-swap/scripts/pool-manager.js`
- Config: `push-swap/scripts/core/config.js`
- Addresses: `test-addresses.json` (auto-generated)

**Frontend**:
- Swap: [swap-interface.tsx](components/swap-interface.tsx#L1-L400)
- Liquidity: [add-liquidity-form.tsx](components/add-liquidity-form.tsx#L1-L450)
- Pools: [app/pools/page.tsx](app/pools/page.tsx#L1-L200)
- Hooks: [hooks/use-uniswap-v3.ts](hooks/use-uniswap-v3.ts#L1-L300)

---

## Common Issues & Solutions

### Issue: Pool Creation Fails with "Pool already exists"
**Solution**: Use `add-liquidity` command instead to add to existing pool

### Issue: Swap Returns Zero Output
**Solution**: Ensure pool has sufficient liquidity and correct price range

### Issue: Position Minting Fails
**Solution**: Check token approvals and balances before adding liquidity

---

**Last Updated**: Oct 28, 2024
**Status**: 🟢 Production Ready
