export enum Chain {
  // Mainnets
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BASE = 'base',
  CELO = 'celo',
  LINEA = 'linea',
  ROOTSTOCK = 'rootstock',
  SAGA = 'saga',
  
  // Testnets
  ETHEREUM_SEPOLIA = 'ethereum_sepolia',
  ETHEREUM_HOLESKY = 'ethereum_holesky',
  POLYGON_MUMBAI = 'polygon_mumbai',
  BASE_SEPOLIA = 'base_sepolia',
  CELO_ALFAJORES = 'celo_alfajores',
  LINEA_SEPOLIA = 'linea_sepolia',
  ROOTSTOCK_TESTNET = 'rootstock_testnet',
  SAGA_TESTNET = 'saga_testnet',
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
    case Chain.SAGA:
      return 3232;
    
    // Testnets
    case Chain.ETHEREUM_SEPOLIA:
      return 11155111;
    case Chain.ETHEREUM_HOLESKY:
      return 17000;
    case Chain.POLYGON_MUMBAI:
      return 80001;
    case Chain.BASE_SEPOLIA:
      return 84532;
    case Chain.CELO_ALFAJORES:
      return 44787;
    case Chain.LINEA_SEPOLIA:
      return 59141;
    case Chain.ROOTSTOCK_TESTNET:
      return 31;
    case Chain.SAGA_TESTNET:
      return 3233;
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
    case Chain.SAGA:
      return 'https://mainnet.saga.xyz/rpc';
    
    // Testnets
    case Chain.ETHEREUM_SEPOLIA:
      return 'https://ethereum-sepolia.publicnode.com';
    case Chain.ETHEREUM_HOLESKY:
      return 'https://ethereum-holesky.publicnode.com';
    case Chain.POLYGON_MUMBAI:
      return 'https://rpc-mumbai.maticvigil.com';
    case Chain.BASE_SEPOLIA:
      return 'https://sepolia.base.org';
    case Chain.CELO_ALFAJORES:
      return 'https://alfajores-forno.celo-testnet.org';
    case Chain.LINEA_SEPOLIA:
      return 'https://rpc.sepolia.linea.build';
    case Chain.ROOTSTOCK_TESTNET:
      return 'https://public-node.testnet.rsk.co';
    case Chain.SAGA_TESTNET:
      return 'https://testnet.saga.xyz/rpc';
    default:
      return 'https://eth.llamarpc.com';
  }
}; 