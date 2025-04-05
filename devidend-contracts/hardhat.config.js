require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('solidity-coverage');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-spdx-license-identifier');
require('hardhat-gas-reporter');
require('hardhat-abi-exporter');
dotenv =require('dotenv');
require("ethers");

const { removeConsoleLog } = require('hardhat-preprocessor');

dotenv.config();

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
        version: "0.8.4"
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
    base_sepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: [process.env.PRIVATE_KEY]
    },
    base: {
      url: process.env.BASE_RPC_URL,
      chainId: 8453,
      accounts: [process.env.PRIVATE_KEY]
    }
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
    apiKey: process.env.BASESCAN_API_KEY,
    customChains: [
     {
      network: "base_sepolia",
      chainId: 84532,
      urls: {
        apiURL: "https://api-sepolia.basescan.org/api",
        browserURL: "https://sepolia.basescan.org/"
      }
     },
     {
      network: "base",
      chainId: 8453,
      urls: {
        apiURL: "https://api.basescan.org/api",
        browserURL: "https://basescan.org/"
      }
     }
   ]
  },
  preprocess: {
    eachLine: removeConsoleLog((bre) => bre.network.name !== 'hardhat' && bre.network.name !== 'localhost'),
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true
  },
  gasReporter: {
    coinmarketcap: '[deploy then input token adress]',
    currency: 'USD',
    enabled: true
  }
};
