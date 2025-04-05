// Chain IDs for different networks
// Ethereum: https://chainlist.org/
// Base: https://docs.base.org/
// Linea: https://docs.linea.build/

// Configuration for mainnet and testnet chain IDs
export const CHAIN_CONFIG = {
  // Mainnet chain IDs
  mainnet: {
    ethereum: "0x1", // Ethereum Mainnet
    base: "0x2105", // Base Mainnet
    linea: "0xe708", // Linea Mainnet
  },
  // Testnet chain IDs
  testnet: {
    ethereum: "0xaa36a7", // Sepolia Testnet
    base: "0x14a34", // Base Sepolia Testnet
    linea: "0xe705", // Linea Sepolia Testnet (updated from Goerli)
  },
}

// Network parameters for adding networks to MetaMask
export const NETWORK_PARAMS = {
  // Mainnet network parameters
  mainnet: {
    ethereum: {
      chainId: CHAIN_CONFIG.mainnet.ethereum,
      chainName: "Ethereum Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://eth-mainnet.public.blastapi.io"],
      blockExplorerUrls: ["https://etherscan.io"],
    },
    base: {
      chainId: CHAIN_CONFIG.mainnet.base,
      chainName: "Base Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"],
    },
    linea: {
      chainId: CHAIN_CONFIG.mainnet.linea,
      chainName: "Linea Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://rpc.linea.build"],
      blockExplorerUrls: ["https://lineascan.build"],
    },
  },
  // Testnet network parameters
  testnet: {
    ethereum: {
      chainId: CHAIN_CONFIG.testnet.ethereum,
      chainName: "Sepolia Testnet",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://rpc.sepolia.org"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
    },
    base: {
      chainId: CHAIN_CONFIG.testnet.base,
      chainName: "Base Sepolia Testnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://sepolia.base.org"],
      blockExplorerUrls: ["https://sepolia.basescan.org"],
    },
    linea: {
      chainId: CHAIN_CONFIG.testnet.linea,
      chainName: "Linea Sepolia Testnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://rpc.sepolia.linea.build"],
      blockExplorerUrls: ["https://sepolia.lineascan.build"],
    },
  },
}

// Helper function to get the appropriate chain IDs based on the app mode
export const getChainIds = () => {
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "production"
  return appMode === "development" ? CHAIN_CONFIG.testnet : CHAIN_CONFIG.mainnet
}

// Helper function to get the appropriate network parameters based on the app mode
export const getNetworkParams = () => {
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "production"
  return appMode === "development" ? NETWORK_PARAMS.testnet : NETWORK_PARAMS.mainnet
}

// Create a reverse mapping from chain ID to chain name
export const createChainNameMapping = (chainIds: typeof CHAIN_CONFIG.mainnet) => {
  return Object.entries(chainIds).reduce(
    (acc, [name, id]) => {
      acc[id] = name
      return acc
    },
    {} as Record<string, string>,
  )
}

