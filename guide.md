# Uniswap V3 Periphery - Complete External Functions Documentation

## Table of Contents
1. [Overview](#overview)
2. [Contract Addresses](#contract-addresses)
3. [Core Contracts](#core-contracts)
4. [Position Management (NonfungiblePositionManager)](#position-management)
5. [Swapping (SwapRouter)](#swapping)
6. [Pool Creation](#pool-creation)
7. [Quoter (Price Quotes)](#quoter)
8. [Helper Functions](#helper-functions)
9. [Frontend Integration Examples](#frontend-integration-examples)

---

## Overview

Uniswap V3 Periphery provides user-friendly contracts for interacting with Uniswap V3 Core. The main contracts are:

- **NonfungiblePositionManager**: Manage liquidity positions as NFTs
- **SwapRouter**: Execute token swaps
- **QuoterV2**: Get price quotes without executing swaps
- **V3Migrator**: Migrate liquidity from V2 to V3
- **TickLens**: Query tick data for pools

---

## Contract Addresses

You'll need to get the deployed addresses for your network (Mainnet, Arbitrum, Optimism, Polygon, etc.) from the [Uniswap V3 deployments](https://docs.uniswap.org/contracts/v3/reference/deployments).

Common addresses:
- **Ethereum Mainnet**:
  - NonfungiblePositionManager: `0xC36442b4a4522E871399CD717aBDD847Ab11FE88`
  - SwapRouter: `0xE592427A0AEce92De3Edee1F18E0157C05861564`
  - QuoterV2: `0x61fFE014bA17989E743c5F6cB21bF9697530B21e`

---

## Core Contracts

### 1. Position Management (NonfungiblePositionManager)

The NonfungiblePositionManager wraps Uniswap V3 positions as ERC721 NFTs, allowing users to manage liquidity positions.

#### Interface: `INonfungiblePositionManager`

---

### `mint` - Create a New Liquidity Position

**Creates a new liquidity position and mints an NFT representing it.**

```solidity
function mint(MintParams calldata params) external payable returns (
    uint256 tokenId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
)
```

**Parameters (MintParams struct):**
```solidity
struct MintParams {
    address token0;           // Address of token0 (lower address)
    address token1;           // Address of token1 (higher address)
    uint24 fee;              // Fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
    int24 tickLower;         // Lower tick of the position
    int24 tickUpper;         // Upper tick of the position
    uint256 amount0Desired;  // Desired amount of token0
    uint256 amount1Desired;  // Desired amount of token1
    uint256 amount0Min;      // Minimum amount of token0 (slippage protection)
    uint256 amount1Min;      // Minimum amount of token1 (slippage protection)
    address recipient;       // Address to receive the NFT
    uint256 deadline;        // Unix timestamp deadline
}
```

**Returns:**
- `tokenId`: The ID of the newly minted NFT position
- `liquidity`: The amount of liquidity added
- `amount0`: Actual amount of token0 added
- `amount1`: Actual amount of token1 added

**Frontend Example:**
```javascript
import { ethers } from 'ethers';

// 1. Approve tokens first
const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, signer);
const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, signer);

await token0Contract.approve(positionManagerAddress, amount0Desired);
await token1Contract.approve(positionManagerAddress, amount1Desired);

// 2. Prepare mint parameters
const mintParams = {
    token0: token0Address,
    token1: token1Address,
    fee: 3000, // 0.3%
    tickLower: -887220, // Full range example
    tickUpper: 887220,
    amount0Desired: ethers.utils.parseUnits('100', 18),
    amount1Desired: ethers.utils.parseUnits('100', 6), // USDC has 6 decimals
    amount0Min: 0, // Consider using slippage tolerance
    amount1Min: 0,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
};

// 3. Call mint
const positionManager = new ethers.Contract(
    positionManagerAddress,
    POSITION_MANAGER_ABI,
    signer
);

const tx = await positionManager.mint(mintParams);
const receipt = await tx.wait();

// 4. Get tokenId from events
const mintEvent = receipt.events.find(e => e.event === 'IncreaseLiquidity');
const tokenId = mintEvent.args.tokenId;
```

**Important Notes:**
- Pool must exist and be initialized before minting (use `createAndInitializePoolIfNecessary` if needed)
- Tokens must be sorted by address (token0 < token1)
- Approve tokens before calling mint
- `tickLower` and `tickUpper` must be valid tick spacings for the fee tier

---

### `increaseLiquidity` - Add Liquidity to Existing Position

**Increases liquidity for an existing position.**

```solidity
function increaseLiquidity(IncreaseLiquidityParams calldata params) external payable returns (
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
)
```

**Parameters:**
```solidity
struct IncreaseLiquidityParams {
    uint256 tokenId;         // NFT token ID of the position
    uint256 amount0Desired;  // Desired amount of token0 to add
    uint256 amount1Desired;  // Desired amount of token1 to add
    uint256 amount0Min;      // Minimum amount of token0 (slippage)
    uint256 amount1Min;      // Minimum amount of token1 (slippage)
    uint256 deadline;        // Unix timestamp deadline
}
```

**Frontend Example:**
```javascript
const increaseParams = {
    tokenId: 12345,
    amount0Desired: ethers.utils.parseUnits('50', 18),
    amount1Desired: ethers.utils.parseUnits('50', 6),
    amount0Min: 0,
    amount1Min: 0,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
};

await positionManager.increaseLiquidity(increaseParams);
```

---

### `decreaseLiquidity` - Remove Liquidity from Position

**Decreases liquidity from a position. Tokens are not automatically collected; use `collect` after.**

```solidity
function decreaseLiquidity(DecreaseLiquidityParams calldata params) external payable returns (
    uint256 amount0,
    uint256 amount1
)
```

**Parameters:**
```solidity
struct DecreaseLiquidityParams {
    uint256 tokenId;      // NFT token ID
    uint128 liquidity;    // Amount of liquidity to remove
    uint256 amount0Min;   // Minimum token0 (slippage)
    uint256 amount1Min;   // Minimum token1 (slippage)
    uint256 deadline;     // Deadline
}
```

**Frontend Example:**
```javascript
const decreaseParams = {
    tokenId: 12345,
    liquidity: '1000000000000000000', // Amount to remove
    amount0Min: 0,
    amount1Min: 0,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20
};

await positionManager.decreaseLiquidity(decreaseParams);
```

---

### `collect` - Collect Tokens from Position

**Collects tokens owed to a position (fees + removed liquidity).**

```solidity
function collect(CollectParams calldata params) external payable returns (
    uint256 amount0,
    uint256 amount1
)
```

**Parameters:**
```solidity
struct CollectParams {
    uint256 tokenId;       // NFT token ID
    address recipient;     // Address to receive tokens
    uint128 amount0Max;    // Max amount of token0 to collect
    uint128 amount1Max;    // Max amount of token1 to collect
}
```

**Frontend Example:**
```javascript
const MAX_UINT128 = '0xffffffffffffffffffffffffffffffff';

const collectParams = {
    tokenId: 12345,
    recipient: userAddress,
    amount0Max: MAX_UINT128, // Collect all
    amount1Max: MAX_UINT128
};

await positionManager.collect(collectParams);
```

---

### `burn` - Burn NFT Position

**Burns an NFT position. Position must have 0 liquidity and all tokens collected.**

```solidity
function burn(uint256 tokenId) external payable
```

**Frontend Example:**
```javascript
await positionManager.burn(tokenId);
```

---

### `positions` - Query Position Data

**Returns data about a specific position.**

```solidity
function positions(uint256 tokenId) external view returns (
    uint96 nonce,
    address operator,
    address token0,
    address token1,
    uint24 fee,
    int24 tickLower,
    int24 tickUpper,
    uint128 liquidity,
    uint256 feeGrowthInside0LastX128,
    uint256 feeGrowthInside1LastX128,
    uint128 tokensOwed0,
    uint128 tokensOwed1
)
```

**Frontend Example:**
```javascript
const position = await positionManager.positions(tokenId);
console.log('Token0:', position.token0);
console.log('Token1:', position.token1);
console.log('Liquidity:', position.liquidity.toString());
console.log('Fees owed:', position.tokensOwed0.toString(), position.tokensOwed1.toString());
```

---

## Pool Creation

### `createAndInitializePoolIfNecessary` - Create and Initialize Pool

**Creates a new pool if it doesn't exist, or initializes it if not yet initialized.**

```solidity
function createAndInitializePoolIfNecessary(
    address token0,
    address token1,
    uint24 fee,
    uint160 sqrtPriceX96
) external payable returns (address pool)
```

**Parameters:**
- `token0`: Address of token0 (must be < token1)
- `token1`: Address of token1
- `fee`: Fee tier (500, 3000, or 10000)
- `sqrtPriceX96`: Initial price as sqrt(price) * 2^96

**Frontend Example:**
```javascript
import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk';

// Example: Initialize pool at 1:1 price ratio
const sqrtPriceX96 = encodeSqrtRatioX96(1, 1).toString();

const poolAddress = await positionManager.createAndInitializePoolIfNecessary(
    token0Address,
    token1Address,
    3000, // 0.3% fee
    sqrtPriceX96
);

console.log('Pool created at:', poolAddress);
```

**Price Calculation:**
```javascript
// For price = token1/token0 = 1500 (e.g., 1 ETH = 1500 USDC)
// sqrtPriceX96 = sqrt(price) * 2^96
const price = 1500;
const sqrtPrice = Math.sqrt(price);
const Q96 = 2n ** 96n;
const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice)) * Q96;

// Or use Uniswap SDK:
import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
const sqrtPriceX96 = encodeSqrtRatioX96(1500, 1);
```

**Important:**
- Pool creation and liquidity provision are separate operations
- Create/initialize pool first, then call `mint` to add liquidity
- You can combine them using `multicall` for atomic execution

**Combined Pool Creation + Liquidity:**
```javascript
// Encode createAndInitializePoolIfNecessary call
const createPoolData = positionManager.interface.encodeFunctionData(
    'createAndInitializePoolIfNecessary',
    [token0, token1, fee, sqrtPriceX96]
);

// Encode mint call
const mintData = positionManager.interface.encodeFunctionData('mint', [mintParams]);

// Execute both atomically via multicall
const tx = await positionManager.multicall([createPoolData, mintData]);
await tx.wait();
```

---

## Swapping (SwapRouter)

### Interface: `ISwapRouter`

---

### `exactInputSingle` - Swap Exact Input for Output (Single Pool)

**Swaps an exact amount of input tokens for as much output as possible.**

```solidity
function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (
    uint256 amountOut
)
```

**Parameters:**
```solidity
struct ExactInputSingleParams {
    address tokenIn;           // Input token address
    address tokenOut;          // Output token address
    uint24 fee;               // Pool fee tier
    address recipient;        // Recipient of output tokens
    uint256 deadline;         // Transaction deadline
    uint256 amountIn;         // Exact input amount
    uint256 amountOutMinimum; // Minimum output (slippage protection)
    uint160 sqrtPriceLimitX96; // Price limit (0 = no limit)
}
```

**Frontend Example:**
```javascript
// 1. Approve tokenIn
await tokenInContract.approve(swapRouterAddress, amountIn);

// 2. Execute swap
const swapParams = {
    tokenIn: tokenInAddress,
    tokenOut: tokenOutAddress,
    fee: 3000,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountIn: ethers.utils.parseUnits('1', 18),
    amountOutMinimum: 0, // Use slippage calculation
    sqrtPriceLimitX96: 0
};

const swapRouter = new ethers.Contract(swapRouterAddress, SWAP_ROUTER_ABI, signer);
const tx = await swapRouter.exactInputSingle(swapParams);
const receipt = await tx.wait();
```

---

### `exactInput` - Swap Exact Input (Multi-hop)

**Swaps exact input through multiple pools.**

```solidity
function exactInput(ExactInputParams calldata params) external payable returns (
    uint256 amountOut
)
```

**Parameters:**
```solidity
struct ExactInputParams {
    bytes path;               // Encoded path (token0, fee, token1, fee, token2, ...)
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
}
```

**Frontend Example:**
```javascript
import { encodeRouteToPath } from '@uniswap/v3-sdk';

// Path: WETH -> USDC -> DAI
const path = encodeRouteToPath(
    [
        { address: wethAddress, fee: 3000 },
        { address: usdcAddress, fee: 500 },
        { address: daiAddress }
    ],
    false // exactInput
);

const params = {
    path: path,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountIn: ethers.utils.parseUnits('1', 18),
    amountOutMinimum: 0
};

await swapRouter.exactInput(params);
```

---

### `exactOutputSingle` - Swap Input for Exact Output (Single Pool)

**Swaps as little input as possible for an exact output amount.**

```solidity
function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (
    uint256 amountIn
)
```

**Parameters:**
```solidity
struct ExactOutputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountOut;        // Exact output desired
    uint256 amountInMaximum;  // Maximum input willing to pay
    uint160 sqrtPriceLimitX96;
}
```

**Frontend Example:**
```javascript
const params = {
    tokenIn: wethAddress,
    tokenOut: usdcAddress,
    fee: 3000,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountOut: ethers.utils.parseUnits('1000', 6), // Want exactly 1000 USDC
    amountInMaximum: ethers.utils.parseUnits('1', 18), // Max 1 ETH
    sqrtPriceLimitX96: 0
};

await swapRouter.exactOutputSingle(params);
```

---

### `exactOutput` - Swap for Exact Output (Multi-hop)

**Swaps through multiple pools for exact output.**

```solidity
function exactOutput(ExactOutputParams calldata params) external payable returns (
    uint256 amountIn
)
```

**Parameters:**
```solidity
struct ExactOutputParams {
    bytes path;              // Encoded path (REVERSED for exactOutput)
    address recipient;
    uint256 deadline;
    uint256 amountOut;
    uint256 amountInMaximum;
}
```

**Frontend Example:**
```javascript
// For exactOutput, path must be REVERSED
const path = encodeRouteToPath(
    [
        { address: daiAddress },
        { address: usdcAddress, fee: 500 },
        { address: wethAddress, fee: 3000 }
    ],
    true // exactOutput = reversed
);

const params = {
    path: path,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountOut: ethers.utils.parseUnits('1', 18),
    amountInMaximum: ethers.utils.parseUnits('2000', 6)
};

await swapRouter.exactOutput(params);
```

---

## Quoter (Price Quotes)

### Interface: `IQuoterV2`

**Get price quotes without executing transactions. NOT for on-chain use!**

---

### `quoteExactInputSingle` - Quote Exact Input Single Pool

**Returns expected output for exact input in a single pool.**

```solidity
function quoteExactInputSingle(QuoteExactInputSingleParams memory params) external returns (
    uint256 amountOut,
    uint160 sqrtPriceX96After,
    uint32 initializedTicksCrossed,
    uint256 gasEstimate
)
```

**Frontend Example:**
```javascript
const quoterV2 = new ethers.Contract(quoterV2Address, QUOTER_V2_ABI, provider);

const params = {
    tokenIn: wethAddress,
    tokenOut: usdcAddress,
    amountIn: ethers.utils.parseUnits('1', 18),
    fee: 3000,
    sqrtPriceLimitX96: 0
};

const quote = await quoterV2.callStatic.quoteExactInputSingle(params);
console.log('Expected output:', ethers.utils.formatUnits(quote.amountOut, 6), 'USDC');
console.log('Gas estimate:', quote.gasEstimate.toString());
```

---

### `quoteExactInput` - Quote Exact Input Multi-hop

```solidity
function quoteExactInput(bytes memory path, uint256 amountIn) external returns (
    uint256 amountOut,
    uint160[] memory sqrtPriceX96AfterList,
    uint32[] memory initializedTicksCrossedList,
    uint256 gasEstimate
)
```

**Frontend Example:**
```javascript
const quote = await quoterV2.callStatic.quoteExactInput(
    encodedPath,
    ethers.utils.parseUnits('1', 18)
);
console.log('Expected output:', quote.amountOut.toString());
```

---

### `quoteExactOutputSingle` - Quote Exact Output Single Pool

**Returns required input for exact output.**

```solidity
function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params) external returns (
    uint256 amountIn,
    uint160 sqrtPriceX96After,
    uint32 initializedTicksCrossed,
    uint256 gasEstimate
)
```

**Frontend Example:**
```javascript
const params = {
    tokenIn: wethAddress,
    tokenOut: usdcAddress,
    amount: ethers.utils.parseUnits('1000', 6), // Want 1000 USDC
    fee: 3000,
    sqrtPriceLimitX96: 0
};

const quote = await quoterV2.callStatic.quoteExactOutputSingle(params);
console.log('Required input:', ethers.utils.formatUnits(quote.amountIn, 18), 'ETH');
```

---

## Helper Functions

### Multicall

**Execute multiple function calls in a single transaction.**

```solidity
function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)
```

**Frontend Example:**
```javascript
// Collect fees and decrease liquidity in one transaction
const collectData = positionManager.interface.encodeFunctionData('collect', [collectParams]);
const decreaseData = positionManager.interface.encodeFunctionData('decreaseLiquidity', [decreaseParams]);

const tx = await positionManager.multicall([decreaseData, collectData]);
await tx.wait();
```

---

### Self Permit

**Approve tokens using EIP-2612 signatures instead of separate approve transaction.**

```solidity
function selfPermit(
    address token,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external payable
```

**Frontend Example:**
```javascript
// Get permit signature
const domain = {
    name: 'Token Name',
    version: '1',
    chainId: 1,
    verifyingContract: tokenAddress
};

const types = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

const value = {
    owner: userAddress,
    spender: positionManagerAddress,
    value: amount,
    nonce: await token.nonces(userAddress),
    deadline: deadline
};

const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);

// Combine permit + mint in multicall
const permitData = positionManager.interface.encodeFunctionData('selfPermit', [
    tokenAddress, amount, deadline, v, r, s
]);
const mintData = positionManager.interface.encodeFunctionData('mint', [mintParams]);

await positionManager.multicall([permitData, mintData]);
```

---

### Periphery Payments

#### `unwrapWETH9` - Unwrap WETH to ETH

```solidity
function unwrapWETH9(uint256 amountMinimum, address recipient) external payable
```

#### `refundETH` - Refund Excess ETH

```solidity
function refundETH() external payable
```

#### `sweepToken` - Recover Tokens

```solidity
function sweepToken(address token, uint256 amountMinimum, address recipient) external payable
```

---

## Frontend Integration Examples

### Complete Flow: Create Pool + Add Liquidity

```javascript
import { ethers } from 'ethers';
import { Token, Pool, Position, nearestUsableTick } from '@uniswap/v3-sdk';
import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk';

async function createPoolAndAddLiquidity() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    // Token addresses (example)
    const token0Address = '0x...'; // Lower address
    const token1Address = '0x...'; // Higher address

    // 1. Approve tokens
    const token0 = new ethers.Contract(token0Address, ERC20_ABI, signer);
    const token1 = new ethers.Contract(token1Address, ERC20_ABI, signer);

    const amount0 = ethers.utils.parseUnits('100', 18);
    const amount1 = ethers.utils.parseUnits('100', 18);

    await token0.approve(POSITION_MANAGER_ADDRESS, amount0);
    await token1.approve(POSITION_MANAGER_ADDRESS, amount1);

    // 2. Create and initialize pool
    const fee = 3000; // 0.3%
    const sqrtPriceX96 = encodeSqrtRatioX96(1, 1); // 1:1 price

    const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        signer
    );

    // 3. Encode both calls
    const createPoolData = positionManager.interface.encodeFunctionData(
        'createAndInitializePoolIfNecessary',
        [token0Address, token1Address, fee, sqrtPriceX96]
    );

    // 4. Prepare mint params
    const mintParams = {
        token0: token0Address,
        token1: token1Address,
        fee: fee,
        tickLower: nearestUsableTick(-887220, TICK_SPACINGS[fee]),
        tickUpper: nearestUsableTick(887220, TICK_SPACINGS[fee]),
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: 0,
        amount1Min: 0,
        recipient: userAddress,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20
    };

    const mintData = positionManager.interface.encodeFunctionData('mint', [mintParams]);

    // 5. Execute atomically
    const tx = await positionManager.multicall([createPoolData, mintData]);
    const receipt = await tx.wait();

    console.log('Transaction successful!', receipt.transactionHash);
}
```

### Complete Flow: Swap Tokens

```javascript
async function swapTokens(tokenIn, tokenOut, amountIn) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 1. Approve tokenIn
    const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    await tokenInContract.approve(SWAP_ROUTER_ADDRESS, amountIn);

    // 2. Get quote first (optional but recommended)
    const quoter = new ethers.Contract(QUOTER_V2_ADDRESS, QUOTER_V2_ABI, provider);
    const quoteParams = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: 3000,
        sqrtPriceLimitX96: 0
    };

    const quote = await quoter.callStatic.quoteExactInputSingle(quoteParams);
    const expectedOutput = quote.amountOut;

    // Apply 0.5% slippage
    const slippageTolerance = 0.5; // 0.5%
    const amountOutMinimum = expectedOutput.mul(10000 - slippageTolerance * 100).div(10000);

    // 3. Execute swap
    const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, signer);
    const swapParams = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: 3000,
        recipient: await signer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
    };

    const tx = await swapRouter.exactInputSingle(swapParams);
    const receipt = await tx.wait();

    console.log('Swap successful!', receipt.transactionHash);
    return receipt;
}
```

### Complete Flow: Manage Existing Position

```javascript
async function manageLiquidityPosition(tokenId) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        signer
    );

    // 1. Get position info
    const position = await positionManager.positions(tokenId);
    console.log('Current liquidity:', position.liquidity.toString());
    console.log('Fees owed:', position.tokensOwed0.toString(), position.tokensOwed1.toString());

    // 2. Collect fees
    const MAX_UINT128 = ethers.constants.MaxUint256;
    const collectParams = {
        tokenId: tokenId,
        recipient: await signer.getAddress(),
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128
    };

    const collectTx = await positionManager.collect(collectParams);
    await collectTx.wait();
    console.log('Fees collected!');

    // 3. Remove all liquidity
    const decreaseParams = {
        tokenId: tokenId,
        liquidity: position.liquidity,
        amount0Min: 0,
        amount1Min: 0,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20
    };

    const decreaseTx = await positionManager.decreaseLiquidity(decreaseParams);
    await decreaseTx.wait();
    console.log('Liquidity removed!');

    // 4. Collect removed liquidity
    await positionManager.collect(collectParams);

    // 5. Burn NFT
    await positionManager.burn(tokenId);
    console.log('Position closed!');
}
```

---

## Important Constants

### Fee Tiers and Tick Spacing
```javascript
const FEE_TIERS = {
    LOW: 500,      // 0.05%
    MEDIUM: 3000,  // 0.3%
    HIGH: 10000    // 1%
};

const TICK_SPACINGS = {
    500: 10,
    3000: 60,
    10000: 200
};
```

### Contract ABIs

You'll need the ABIs from the compiled contracts:
```javascript
import POSITION_MANAGER_ABI from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json';
import SWAP_ROUTER_ABI from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
import QUOTER_V2_ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
```

---

## Key Concepts

### Pool Creation vs Adding Liquidity

**Two separate operations:**
1. **Create Pool**: Use `createAndInitializePoolIfNecessary`
   - Creates pool contract
   - Sets initial price
   - Can be done by anyone
   - No liquidity added yet

2. **Add Liquidity**: Use `mint` or `increaseLiquidity`
   - Adds tokens to pool
   - Requires pool to exist and be initialized
   - Receives LP NFT

**Best Practice:** Use `multicall` to combine both operations atomically.

### Tick Spacing

Each fee tier has a tick spacing requirement:
- 0.05% fee: tick spacing of 10
- 0.3% fee: tick spacing of 60
- 1% fee: tick spacing of 200

Use `nearestUsableTick` from SDK to ensure valid ticks.

### Slippage Protection

Always set `amount0Min`, `amount1Min`, and `amountOutMinimum`:
```javascript
const slippage = 0.5; // 0.5%
const amountMin = expectedAmount * (100 - slippage) / 100;
```

### Deadlines

Always set reasonable deadlines (typically 10-20 minutes):
```javascript
const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
```

---

## Common Errors and Solutions

### "Transaction will fail: INSUFFICIENT_LIQUIDITY"
- Pool doesn't exist or has no liquidity
- Create pool first with `createAndInitializePoolIfNecessary`

### "Transaction will fail: STF" (SafeTransferFrom failed)
- Missing token approval
- Call `approve()` before operations

### "Invalid tick"
- Tick not aligned to tick spacing
- Use `nearestUsableTick()` from SDK

### "Price slippage check"
- Price moved beyond slippage tolerance
- Increase `amount0Min`/`amount1Min` or retry

---

## References

- [Uniswap V3 SDK](https://github.com/Uniswap/v3-sdk)
- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [Contract Deployments](https://docs.uniswap.org/contracts/v3/reference/deployments)
- [Whitepaper](https://uniswap.org/whitepaper-v3.pdf)

---

**Generated for Uniswap V3 Periphery v1.4.4**
