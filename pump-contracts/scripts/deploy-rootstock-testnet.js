const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main()
{
  console.log("Deploying CoinSeller to Rootstock Testnet...");
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  // Get account information
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} RBTC`);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: Rootstock Testnet (Chain ID: ${network.chainId})`);
  
  // Get gas price
  const gasPrice = await ethers.provider.getGasPrice();
  console.log(`Gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  try {
    // Deploy contract
    console.log("Deploying CoinSeller contract...");
    const SELLER = await ethers.getContractFactory('CoinSeller');
    const seller = await SELLER.deploy();
    
    console.log(`Transaction hash: ${seller.deployTransaction.hash}`);
    console.log("Waiting for deployment transaction to be mined...");
    
    await seller.deployed();
    console.log('CoinSeller deployed to:', seller.address);
    
    console.log('Waiting for confirmations...');
    await seller.deployTransaction.wait(2);
    
    console.log("============= Verifying Contract =============");

    // Verify
    try {
      await hre.run("verify:verify", {
        address: seller.address,
        contract: 'contracts/coinseller.sol:CoinSeller',
      });
      console.log("Contract verified successfully!");
      console.log(`View on explorer: https://explorer.testnet.rsk.co/address/${seller.address}`);
    } catch (error) {
      console.error("Verification error:", error.message);
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified!");
      } else {
        console.log("Manual verification may be required. Run:");
        console.log(`npx hardhat verify --network rootstock_testnet 0xaC20EF932f62B66D9b402da26E70716695EF2a09`);
        console.log(`View on explorer: https://explorer.testnet.rsk.co/address/${seller.address}`);
      }
    }
  } catch (error) {
    console.error("Deployment error:", error);
    process.exit(1);
  }
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  }); 