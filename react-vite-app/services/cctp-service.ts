// CCTP (Cross-Chain Transfer Protocol) Service
// Based on Circle's official CCTP sample app: https://github.com/circlefin/cctp-sample-app

// API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ethglobal-taipei-badguy.onrender.com"

// Domain IDs for supported chains (from Circle documentation)
const DOMAIN_IDS = {
  ethereum: {
    mainnet: 0,
    testnet: 0, // Sepolia
  },
  avalanche: {
    mainnet: 1,
    testnet: 1, // Fuji
  },
  optimism: {
    mainnet: 2,
    testnet: 2, // Optimism Goerli
  },
  arbitrum: {
    mainnet: 3,
    testnet: 3, // Arbitrum Goerli
  },
  base: {
    mainnet: 6,
    testnet: 6, // Base Sepolia
  },
  linea: {
    mainnet: 7,
    testnet: 7, // Linea Sepolia
  },
}

// Contract addresses for CCTP (these would typically come from a configuration file)
const CCTP_CONTRACTS = {
  // Testnet (Sepolia)
  testnet: {
    ethereum: {
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    },
    base: {
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    },
    linea: {
      usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    },
  },
  // Mainnet
  mainnet: {
    ethereum: {
      usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenMessenger: "0xBd3fa81B58Ba92a82136038B25aDec7066AF3155",
      messageTransmitter: "0x0a992d191deec32afe36203ad87d7d289a738f81",
    },
    base: {
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      tokenMessenger: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
      messageTransmitter: "0x9ff9a4da6f2157a9c82ce756f8fd7e0d75be8895",
    },
    linea: {
      usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
      tokenMessenger: "0xd9eD2B3446D9f428e158B1Be4c7Ae94c4d5f9e9A",
      messageTransmitter: "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8",
    },
  },
}

/**
 * Get the domain ID for a specific chain
 * Domain IDs are used in CCTP to identify different blockchains
 */
export function getDomainId(chain: string): number | null {
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "production"
  const networkType = appMode === "development" ? "testnet" : "mainnet"

  const chainLower = chain.toLowerCase()
  return DOMAIN_IDS[chainLower as keyof typeof DOMAIN_IDS]?.[networkType] ?? null
}

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chain: string): any {
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "production"
  const networkType = appMode === "development" ? "testnet" : "mainnet"

  const chainLower = chain.toLowerCase()
  return CCTP_CONTRACTS[networkType][chainLower as keyof typeof CCTP_CONTRACTS.testnet] || null
}

/**
 * Format bytes32 address for CCTP
 * Adds 12 empty bytes in front of the EVM address as required by CCTP
 */
export function formatBytes32Address(evmAddress: string): string {
  // Remove '0x' prefix if present
  const cleanAddress = evmAddress.startsWith("0x") ? evmAddress.slice(2) : evmAddress

  // Add 12 bytes (24 characters) of zeros in front of the address
  return "0x" + "0".repeat(24) + cleanAddress
}

/**
 * Deposit USDC from one chain to another
 * This function follows Circle's CCTP implementation pattern
 */
export async function depositUSDC(
  sourceChain: string,
  destinationChain: string,
  amount: string,
  recipient: string,
  privateKey: string,
): Promise<any> {
  try {
    console.log("Initiating CCTP transfer with the following parameters:")
    console.log({
      sourceChain,
      destinationChain,
      amount,
      recipient: recipient.substring(0, 10) + "...", // Log partial address for privacy
    })

    // Get domain IDs
    const sourceDomainId = getDomainId(sourceChain)
    const destinationDomainId = getDomainId(destinationChain)

    if (!sourceDomainId || !destinationDomainId) {
      throw new Error(`Invalid chain: ${!sourceDomainId ? sourceChain : destinationChain}`)
    }

    // Format the destination address as bytes32
    const formattedRecipient = formatBytes32Address(recipient)

    // Prepare the request body following Circle's CCTP pattern
    const requestBody = {
      sourceChain,
      destinationChain,
      amount,
      recipient,
      formattedRecipient,
      sourceDomainId,
      destinationDomainId,
      privateKey,
    }

    console.log("Attempting CCTP deposit...")

    // Based on the URL you shared, let's try the correct endpoint
    const response = await fetch(`${API_URL}/cctp/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error (${response.status}):`, errorText)
      throw new Error(`API error: ${response.status} - ${errorText || "No error details"}`)
    }

    const result = await response.json()
    console.log("Transfer initiated successfully:", result)

    return result
  } catch (error) {
    console.error("Error depositing USDC:", error)
    throw error
  }
}

/**
 * Get transfer history for a specific address on a specific chain
 */
export async function getTransferHistory(address: string, chain: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/cctp/history?address=${address}&chain=${chain}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error (${response.status}):`, errorText)
      throw new Error(`API error: ${response.status} - ${errorText || "No error details"}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting transfer history:", error)
    throw error
  }
}

/**
 * Check the status of a specific transfer using a transfer ID
 */
export async function getTransferStatus(transferId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/cctp/status?transferId=${transferId}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error (${response.status}):`, errorText)
      throw new Error(`API error: ${response.status} - ${errorText || "No error details"}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error checking transfer status:", error)
    throw error
  }
}

