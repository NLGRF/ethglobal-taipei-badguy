const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main() {
  console.log("============= Deploying CoinSeller to Celo Mainnet =============");
  
  // Get deployer address and display info
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract with account: ${deployer.address}`);
  
  // Display balance
  const balanceBefore = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.utils.formatEther(balanceBefore)} CELO`);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: Celo Mainnet (Chain ID: ${network.chainId})`);
  
  // Get gas price and increase it by 10% to ensure transaction goes through
  const gasPrice = await ethers.provider.getGasPrice();
  const increasedGasPrice = gasPrice.mul(110).div(100); // 10% increase
  console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  console.log(`Using increased gas price: ${ethers.utils.formatUnits(increasedGasPrice, 'gwei')} gwei`);
  
  // Deploy the contract
  try {
    const SELLER = await ethers.getContractFactory('CoinSeller');
    
    // Deploy with specific gas settings
    const seller = await SELLER.deploy({
      gasPrice: increasedGasPrice
    });
    
    console.log(`Transaction hash: ${seller.deployTransaction.hash}`);
    console.log('Waiting for contract deployment...');
    
    await seller.deployed();
    console.log('CoinSeller deployed to:', seller.address);
    
    // Wait for additional confirmations for mainnet
    console.log('Waiting for confirmations (this may take a while on mainnet)...');
    await seller.deployTransaction.wait(3); // Wait for 3 confirmations on mainnet
    
    // Get remaining balance
    const balanceAfter = await ethers.provider.getBalance(deployer.address);
    console.log(`Remaining account balance: ${ethers.utils.formatEther(balanceAfter)} CELO`);
    console.log(`Deployment cost: ${ethers.utils.formatEther(balanceBefore.sub(balanceAfter))} CELO`);
    
    console.log("============= Verifying Contract =============");
    
    // Verify - Wait longer for mainnet indexing
    try {
      console.log("Waiting 60 seconds before verification to ensure the contract is indexed...");
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      await hre.run("verify:verify", {
        address: seller.address,
        contract: 'contracts/coinseller.sol:CoinSeller',
      });
      
      console.log("Contract verified successfully on Celo Explorer!");
    } catch (error) {
      console.error("Verification error:", error.message);
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified!");
      } else if (error.message.includes("Missing or invalid ApiKey")) {
        console.log("API key issue. Check your CELOSCAN_API_KEY in .env file");
        console.log("For manual verification, run:");
        console.log("npx hardhat flatten contracts/coinseller.sol > CoinSeller_flattened.sol");
        console.log("Then visit https://celoscan.io/verifyContract and upload the flattened contract");
      }
    }
    
  } catch (error) {
    console.error("Deployment error:", error.message);
    if (error.message.includes("nonce")) {
      console.error("Nonce issue detected. You may need to adjust your nonce value.");
      console.error("Try adding { nonce: X } to the deployment options where X is your current nonce + 1");
    } else if (error.message.includes("replacement fee too low") || error.message.includes("underpriced")) {
      console.error("Gas price too low for replacing a pending transaction with the same nonce.");
      console.error("Try increasing the gas price further in the script or wait for pending transactions to complete.");
    } else if (error.message.includes("insufficient funds")) {
      console.error("Your account doesn't have enough CELO to deploy this contract.");
      console.error("Make sure you have at least 1 CELO to cover deployment costs plus some buffer.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 