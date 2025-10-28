import { PushChain } from "@pushchain/core"
import { ethers } from "ethers"

export type UniversalSigner = Awaited<ReturnType<typeof PushChain.utils.signer.toUniversal>>
export type PushChainClient = Awaited<ReturnType<typeof PushChain.initialize>>

let pushChainInitialized = false

/**
 * Initialize Push Chain client with EVM wallet (MetaMask, Coinbase, etc.)
 */
export async function initializePushChainEVM(): Promise<PushChainClient> {
  if (typeof window === "undefined") {
    throw new Error("This function can only be called in the browser")
  }

  if (!window.ethereum) {
    throw new Error("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.")
  }

  try {
    // Request account access
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send("eth_requestAccounts", [])

    const signer = await provider.getSigner()

    let universalSigner
    try {
      universalSigner = await PushChain.utils.signer.toUniversal(signer)
    } catch (error) {
      console.error("[v0] Failed to convert to universal signer:", error)
      throw new Error("Failed to initialize universal signer. Please try again.")
    }

    let pushChainClient
    try {
      pushChainClient = await PushChain.initialize(universalSigner, {
        network: PushChain.CONSTANTS.PUSH_NETWORK.TESTNET,
      })
      pushChainInitialized = true
    } catch (error) {
      console.error("[v0] Failed to initialize Push Chain:", error)
      throw new Error("Failed to initialize Push Chain. Please try again.")
    }

    return pushChainClient
  } catch (error: any) {
    console.error("[v0] EVM initialization error:", error)
    throw error
  }
}

/**
 * Initialize Push Chain client with Solana wallet (Phantom)
 */
export async function initializePushChainSolana(): Promise<PushChainClient> {
  if (typeof window === "undefined") {
    throw new Error("This function can only be called in the browser")
  }

  if (!window.phantom?.solana) {
    throw new Error("Phantom wallet not detected. Please install Phantom.")
  }

  try {
    const solanaProvider = window.phantom.solana
    await solanaProvider.connect()

    let universalSigner
    try {
      universalSigner = await PushChain.utils.signer.toUniversal(solanaProvider, "solana")
    } catch (error) {
      console.error("[v0] Failed to convert Solana signer to universal:", error)
      throw new Error("Failed to initialize Solana signer. Please try again.")
    }

    let pushChainClient
    try {
      pushChainClient = await PushChain.initialize(universalSigner, {
        network: PushChain.CONSTANTS.PUSH_NETWORK.TESTNET,
      })
      pushChainInitialized = true
    } catch (error) {
      console.error("[v0] Failed to initialize Push Chain with Solana:", error)
      throw new Error("Failed to initialize Push Chain. Please try again.")
    }

    return pushChainClient
  } catch (error: any) {
    console.error("[v0] Solana initialization error:", error)
    throw error
  }
}

/**
 * Get user's chain information
 */
export async function getUserChainInfo() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const network = await provider.getNetwork()

    return {
      chainId: Number(network.chainId),
      name: network.name,
    }
  } catch (error) {
    console.error("[v0] Failed to get chain info:", error)
    return null
  }
}

/**
 * Switch to a specific network
 */
export async function switchNetwork(chainId: number) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No Ethereum wallet detected")
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      throw new Error("Please add this network to your wallet first")
    }
    throw error
  }
}

// Type declarations for window objects
declare global {
  interface Window {
    ethereum?: any
    phantom?: {
      solana?: any
    }
  }
}
