const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main() {
  console.log("============= Deploying CoinSeller to Polygon Amoy =============");
  
  // Get deployer address and display info
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract with account: ${deployer.address}`);
  
  // Display balance
  const balanceBefore = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.utils.formatEther(balanceBefore)} MATIC`);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: Polygon Amoy (Chain ID: ${network.chainId})`);
  
  // Get gas price
  const gasPrice = await ethers.provider.getGasPrice();
  console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  
  // Deploy the contract
  try {
    const SELLER = await ethers.getContractFactory('CoinSeller');
    const seller = await SELLER.deploy();
    
    console.log(`Transaction hash: ${seller.deployTransaction.hash}`);
    console.log('Waiting for contract deployment...');
    
    await seller.deployed();
    console.log('CoinSeller deployed to:', seller.address);
    
    // Wait for additional confirmations
    console.log('Waiting for confirmations...');
    await seller.deployTransaction.wait(2);
    
    // Get remaining balance
    const balanceAfter = await ethers.provider.getBalance(deployer.address);
    console.log(`Remaining account balance: ${ethers.utils.formatEther(balanceAfter)} MATIC`);
    console.log(`Deployment cost: ${ethers.utils.formatEther(balanceBefore.sub(balanceAfter))} MATIC`);
    
    console.log("============= Verifying Contract =============");
    
    // Verify
    try {
      console.log("Waiting 30 seconds before verification to ensure the contract is indexed...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      await hre.run("verify:verify", {
        address: seller.address,
        contract: 'contracts/coinseller.sol:CoinSeller',
      });
      
      console.log("Contract verified successfully on Polygon Amoy Explorer!");
    } catch (error) {
      console.error("Verification error:", error.message);
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified!");
      }
    }
    
  } catch (error) {
    console.error("Deployment error:", error.message);
    if (error.message.includes("nonce")) {
      console.error("You may need to adjust your nonce. Check your current account nonce on the blockchain.");
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