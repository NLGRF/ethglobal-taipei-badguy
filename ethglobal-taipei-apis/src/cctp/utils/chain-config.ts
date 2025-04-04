export type ChainConfig = {
    name: string;
    chainId: number;
    domainId: number;
    rpcUrl: string;
    usdc: string;
    tokenMessenger: string;
    messageTransmitter: string;
  };
  
  const isProd = process.env.NODE_ENV === 'production';
  
  export const getChainConfig = (chainKey: string): ChainConfig => {
    switch (chainKey.toLowerCase()) {
      case 'ethereum':
        return {
          name: 'Ethereum',
          chainId: isProd ? +process.env.ETHEREUM_CHAIN_ID! : +process.env.ETHEREUM_TESTNET_CHAIN_ID!,
          domainId: 0,
          rpcUrl: isProd ? process.env.ETHEREUM_RPC! : process.env.ETHEREUM_TESTNET_RPC!,
          usdc: isProd ? process.env.ETHEREUM_USDC! : process.env.ETHEREUM_TESTNET_USDC!,
          tokenMessenger: isProd ? process.env.ETHEREUM_TOKEN_MESSENGER! : process.env.ETHEREUM_TESTNET_TOKEN_MESSENGER!,
          messageTransmitter: isProd ? process.env.ETHEREUM_MSG_TRANSMITTER! : process.env.ETHEREUM_TESTNET_MSG_TRANSMITTER!,
        };
  
      case 'base':
        return {
          name: 'Base',
          chainId: isProd ? +process.env.BASE_CHAIN_ID! : +process.env.BASE_TESTNET_CHAIN_ID!,
          domainId: 6,
          rpcUrl: isProd ? process.env.BASE_RPC! : process.env.BASE_TESTNET_RPC!,
          usdc: isProd ? process.env.BASE_USDC! : process.env.BASE_TESTNET_USDC!,
          tokenMessenger: isProd ? process.env.BASE_TOKEN_MESSENGER! : process.env.BASE_TESTNET_TOKEN_MESSENGER!,
          messageTransmitter: isProd ? process.env.BASE_MSG_TRANSMITTER! : process.env.BASE_TESTNET_MSG_TRANSMITTER!,
        };
  
      case 'linea':
        return {
          name: 'Linea',
          chainId: isProd ? +process.env.LINEA_CHAIN_ID! : +process.env.LINEA_TESTNET_CHAIN_ID!,
          domainId: 9,
          rpcUrl: isProd ? process.env.LINEA_RPC! : process.env.LINEA_TESTNET_RPC!,
          usdc: isProd ? process.env.LINEA_USDC! : process.env.LINEA_TESTNET_USDC!,
          tokenMessenger: isProd ? process.env.LINEA_TOKEN_MESSENGER! : process.env.LINEA_TESTNET_TOKEN_MESSENGER!,
          messageTransmitter: isProd ? process.env.LINEA_MSG_TRANSMITTER! : process.env.LINEA_TESTNET_MSG_TRANSMITTER!,
        };
  
      default:
        throw new Error(`Unsupported chain: ${chainKey}`);
    }
  };
  