export enum Chain {
  // Mainnets
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BASE = 'base',
  CELO = 'celo',
  LINEA = 'linea',
  ROOTSTOCK = 'rootstock',
  
  // Testnets
  ETHEREUM_SEPOLIA = 'ethereum_sepolia',
  POLYGON_AMOY = 'polygon_amoy',
  BASE_SEPOLIA = 'base_sepolia',
  CELO_ALFAJORES = 'celo_alfajores',
  LINEA_SEPOLIA = 'linea_sepolia',
  ROOTSTOCK_TESTNET = 'rootstock_testnet',
}

export const getChainId = (chain: Chain): number => {
  switch (chain) {
    // Mainnets
    case Chain.ETHEREUM:
      return 1;
    case Chain.POLYGON:
      return 137;
    case Chain.BASE:
      return 8453;
    case Chain.CELO:
      return 42220;
    case Chain.LINEA:
      return 59144;
    case Chain.ROOTSTOCK:
      return 30;
    
    // Testnets
    case Chain.ETHEREUM_SEPOLIA:
      return 11155111;
    case Chain.POLYGON_AMOY:
      return 80002;
    case Chain.BASE_SEPOLIA:
      return 84532;
    case Chain.CELO_ALFAJORES:
      return 44787;
    case Chain.LINEA_SEPOLIA:
      return 59141;
    case Chain.ROOTSTOCK_TESTNET:
      return 31;
    default:
      return 1;
  }
};

export const getChainRPC = (chain: Chain): string => {
  switch (chain) {
    // Mainnets
    case Chain.ETHEREUM:
      return 'https://eth.llamarpc.com';
    case Chain.POLYGON:
      return 'https://polygon.llamarpc.com';
    case Chain.BASE:
      return 'https://base.llamarpc.com';
    case Chain.CELO:
      return 'https://forno.celo.org';
    case Chain.LINEA:
      return 'https://rpc.linea.build';
    case Chain.ROOTSTOCK:
      return 'https://public-node.rsk.co';
    
    // Testnets
    case Chain.ETHEREUM_SEPOLIA:
      return 'https://ethereum-sepolia.publicnode.com';
    case Chain.POLYGON_AMOY:
      return 'https://rpc-amoy.polygon.technology';
    case Chain.BASE_SEPOLIA:
      return 'https://sepolia.base.org';
    case Chain.CELO_ALFAJORES:
      return 'https://alfajores-forno.celo-testnet.org';
    case Chain.LINEA_SEPOLIA:
      return 'https://rpc.sepolia.linea.build';
    case Chain.ROOTSTOCK_TESTNET:
      return 'https://public-node.testnet.rsk.co';
    default:
      return 'https://eth.llamarpc.com';
  }
};

export const getGasSellerAddress = (chain: Chain): string => {
  switch (chain) {
    // Mainnets
    case Chain.ETHEREUM:
      return '0x0000000000000000000000000000000000000000';
    case Chain.POLYGON:
      return '0x0000000000000000000000000000000000000000';
    case Chain.BASE:
      return '0x0000000000000000000000000000000000000000';
    case Chain.CELO:
      return '0x0000000000000000000000000000000000000000';
    case Chain.LINEA:
      return '0x0000000000000000000000000000000000000000';
    case Chain.ROOTSTOCK:
      return '0x0000000000000000000000000000000000000000';
    
    // Testnets
    case Chain.ETHEREUM_SEPOLIA:
      return '0x9285c4Aa8409D2A7A6b29dE2e62e7c3bF9b2dcdE';
    case Chain.POLYGON_AMOY:
      return '0xaC20EF932f62B66D9b402da26E70716695EF2a09';
    case Chain.BASE_SEPOLIA:
      return '0xaC20EF932f62B66D9b402da26E70716695EF2a09';
    case Chain.CELO_ALFAJORES:
      return '0xaC20EF932f62B66D9b402da26E70716695EF2a09';
    case Chain.LINEA_SEPOLIA:
      return '0x0000000000000000000000000000000000000000';
    case Chain.ROOTSTOCK_TESTNET:
      return '0xaC20eF932F62B66D9b402Da26E70716695EF2a09';
    default:
      return '0x0000000000000000000000000000000000000000';
  }
}; 