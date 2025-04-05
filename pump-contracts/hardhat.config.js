require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('solidity-coverage');
require('@nomicfoundation/hardhat-verify');
require('hardhat-spdx-license-identifier');
require('hardhat-gas-reporter');
require('hardhat-abi-exporter');
dotenv =require('dotenv');
require("ethers");

const { removeConsoleLog } = require('hardhat-preprocessor');

dotenv.config();

// Chain enum definition
const Chain = {
  // Mainnets
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  BASE: 'base',
  CELO: 'celo',
  LINEA: 'linea',
  ROOTSTOCK: 'rootstock',
  
  // Testnets
  ETHEREUM_SEPOLIA: 'ethereum_sepolia',
  POLYGON_AMOY: 'polygon_amoy',
  BASE_SEPOLIA: 'base_sepolia',
  CELO_ALFAJORES: 'celo_alfajores',
  LINEA_SEPOLIA: 'linea_sepolia',
  ROOTSTOCK_TESTNET: 'rootstock_testnet'
};

// Function to get chainId from Chain enum
function getChainId(chain) {
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
      throw new Error(`Unknown chain: ${chain}`);
  }
}

task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16"
      },
      {
        version: "0.6.12"
      },
      {
        version: "0.8.10"
      },
      {
        version: "0.8.21"
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      }
     }
  },
  abiExporter: {
    path: './abi',
    clear: false,
    flat: true
  },
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    hardhat: {
      initialBaseFeePerGas: 0
    },
    testnet: {
      url: 'https://bsc-testnet.publicnode.com',
      chainId: 97,
      gasPrice: 20*1e9,
      gas:500000,
      minGasPrice:500000,
      accounts:[process.env.PRIVATE_KEY]
    },
    // Mainnets
    [Chain.ETHEREUM]: {
      chainId: getChainId(Chain.ETHEREUM),
      url: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.POLYGON]: {
      chainId: getChainId(Chain.POLYGON),
      url: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.BASE]: {
      chainId: getChainId(Chain.BASE),
      url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.CELO]: {
      chainId: getChainId(Chain.CELO),
      url: process.env.CELO_RPC_URL || 'https://forno.celo.org',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.LINEA]: {
      chainId: getChainId(Chain.LINEA),
      url: process.env.LINEA_RPC_URL || 'https://rpc.linea.build',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.ROOTSTOCK]: {
      chainId: getChainId(Chain.ROOTSTOCK),
      url: process.env.ROOTSTOCK_RPC_URL || 'https://public-node.rsk.co',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    
    // Testnets
    [Chain.ETHEREUM_SEPOLIA]: {
      chainId: getChainId(Chain.ETHEREUM_SEPOLIA),
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.POLYGON_AMOY]: {
      chainId: getChainId(Chain.POLYGON_AMOY),
      url: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.BASE_SEPOLIA]: {
      chainId: getChainId(Chain.BASE_SEPOLIA),
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.CELO_ALFAJORES]: {
      chainId: getChainId(Chain.CELO_ALFAJORES),
      url: process.env.CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.LINEA_SEPOLIA]: {
      chainId: getChainId(Chain.LINEA_SEPOLIA),
      url: process.env.LINEA_SEPOLIA_RPC_URL || 'https://rpc.sepolia.linea.build',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
    [Chain.ROOTSTOCK_TESTNET]: {
      chainId: getChainId(Chain.ROOTSTOCK_TESTNET),
      url: process.env.ROOTSTOCK_TESTNET_RPC_URL || 'https://public-node.testnet.rsk.co',
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: {
    timeout: 20000
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
      celo: process.env.CELOSCAN_API_KEY,
      linea: process.env.LINEASCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      baseTestnet: process.env.BASESCAN_API_KEY,
      rootstockTestnet: "api-key-not-needed",
      polygon_amoy: process.env.POLYGONSCAN_API_KEY
    },
    customChains: [
      {
        network: "lineagoerli",
        chainId: 59140,
        urls: {
          apiURL: "https://api-testnet.lineascan.build/api",
          browserURL: "https://goerli.lineascan.build/"
        }
      },
      {
        network: 'baseTestnet',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org'
        }
      },
      {
        network: 'linea',
        chainId: 59144,
        urls: {
          apiURL: 'https://api.lineascan.build/api',
          browserURL: 'https://lineascan.build/'
        }
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org'
        }
      },
      {
        network: 'celo',
        chainId: 42220,
        urls: {
          apiURL: 'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io'
        }
      },
      {
        network: 'celo_alfajores',
        chainId: 44787,
        urls: {
          apiURL: 'https://api-alfajores.celoscan.io/api',
          browserURL: 'https://alfajores.celoscan.io'
        }
      },
      {
        network: 'linea_sepolia',
        chainId: 59141,
        urls: {
          apiURL: 'https://api-sepolia.lineascan.build/api',
          browserURL: 'https://sepolia.lineascan.build'
        }
      },
      {
        network: 'polygon_amoy',
        chainId: 80002,
        urls: {
          apiURL: 'https://api-amoy.polygonscan.com/api',
          browserURL: 'https://amoy.polygonscan.com/'
        }
      },
      {
        network: 'rootstockTestnet',
        chainId: 31,
        urls: {
          apiURL: 'https://explorer.testnet.rsk.co/api',
          browserURL: 'https://explorer.testnet.rsk.co/'
        }
      },
    ]
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true
  },
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: 'USD',
    enabled: true
  }
};
