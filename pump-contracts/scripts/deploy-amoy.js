const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main() {
  console.log("Deploying CoinSeller contract to Polygon Amoy...");
  
  try {
    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}`);
    
    // Get deployer info
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    
    // Get balance
    const balance = await deployer.getBalance();
    console.log(`Account balance: ${ethers.utils.formatEther(balance)} MATIC`);
    
    // Gas info
    const gasPrice = await ethers.provider.getGasPrice();
    console.log(`Gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

    // Deploy contract
    console.log("Creating contract factory...");
    const SELLER = await ethers.getContractFactory('CoinSeller');
    
    console.log("Deploying contract...");
    const deploymentOptions = {
      gasLimit: 3000000, // Manual gas limit
      gasPrice: gasPrice // Current gas price
    };
    
    const seller = await SELLER.deploy(deploymentOptions);
    console.log(`Contract deployment transaction hash: ${seller.deployTransaction.hash}`);
    console.log("Waiting for deployment transaction to be mined...");
    
    await seller.deployed();
    console.log(`CoinSeller deployed to: ${seller.address}`);
    
    // Wait for confirmations
    console.log("Waiting for confirmations (this may take a few minutes)...");
    await seller.deployTransaction.wait(2);
    console.log("Contract confirmed.");
    
    // For Polygon Amoy verification, we need to manually run the verification command
    console.log("");
    console.log("============= Manual Verification Required =============");
    console.log("To verify the contract on Polygon Amoy, run this command:");
    console.log(`npx hardhat verify --network polygon_amoy ${seller.address}`);
    console.log("");
    console.log("View your contract at:");
    console.log(`https://amoy.polygonscan.com/address/${seller.address}`);

  } catch (error) {
    console.error("Deployment error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 