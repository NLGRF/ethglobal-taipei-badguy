const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main() {
  console.log("============= Deploying CoinSeller to Celo Alfajores =============");
  
  // Get deployer address and display info
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract with account: ${deployer.address}`);
  
  // Display balance
  const balanceBefore = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.utils.formatEther(balanceBefore)} CELO`);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: Celo Alfajores (Chain ID: ${network.chainId})`);
  
  // Get gas price and increase it by 50% to avoid nonce issues
  const gasPrice = await ethers.provider.getGasPrice();
  const increasedGasPrice = gasPrice.mul(150).div(100); // 50% increase
  console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  console.log(`Using increased gas price: ${ethers.utils.formatUnits(increasedGasPrice, 'gwei')} gwei`);
  
  // Deploy the contract
  try {
    const SELLER = await ethers.getContractFactory('CoinSeller');
    
    // Deploy with specific gas settings to avoid nonce issues
    const seller = await SELLER.deploy({
      gasPrice: increasedGasPrice
    });
    
    console.log(`Transaction hash: ${seller.deployTransaction.hash}`);
    console.log('Waiting for contract deployment...');
    
    await seller.deployed();
    console.log('CoinSeller deployed to:', seller.address);
    
    // Wait for additional confirmations
    console.log('Waiting for confirmations...');
    await seller.deployTransaction.wait(2);
    
    // Get remaining balance
    const balanceAfter = await ethers.provider.getBalance(deployer.address);
    console.log(`Remaining account balance: ${ethers.utils.formatEther(balanceAfter)} CELO`);
    console.log(`Deployment cost: ${ethers.utils.formatEther(balanceBefore.sub(balanceAfter))} CELO`);
    
    console.log("============= Verifying Contract =============");
    
    // Verify
    try {
      console.log("Waiting 30 seconds before verification to ensure the contract is indexed...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      await hre.run("verify:verify", {
        address: seller.address,
        contract: 'contracts/coinseller.sol:CoinSeller',
      });
      
      console.log("Contract verified successfully on Celo Alfajores Explorer!");
    } catch (error) {
      console.error("Verification error:", error.message);
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified!");
      } else if (error.message.includes("Missing or invalid ApiKey")) {
        console.log("API key issue. Please check your CELOSCAN_API_KEY in .env file");
        console.log("If verification fails, try manual verification with the flattened contract:");
        console.log("npx hardhat flatten contracts/coinseller.sol > CoinSeller_flattened.sol");
      }
    }
    
  } catch (error) {
    console.error("Deployment error:", error.message);
    if (error.message.includes("nonce")) {
      console.error("You may need to adjust your nonce. Check your current account nonce on the blockchain.");
      console.error("Try adding a specific nonce parameter to the deployment:");
      console.error("Add { nonce: X } where X is your current nonce + 1");
    } else if (error.message.includes("replacement fee too low") || error.message.includes("underpriced")) {
      console.error("Gas price too low for replacing a pending transaction with the same nonce.");
      console.error("1. Wait for the pending transaction to complete first, or");
      console.error("2. Increase the gas price further in the script");
    } else if (error.message.includes("gas")) {
      console.error("You may need to adjust gas settings or wait for network congestion to decrease.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 