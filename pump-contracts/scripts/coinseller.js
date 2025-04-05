const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main()
{

  // const feedata = await ethers.provider.getFeeData()
  // console.log(feedata)
  
  const SELLER = await ethers.getContractFactory('CoinSeller');
  const seller = await SELLER.deploy();
  await seller.deployed();
  
  console.log('CoinSeller Deployed to:', seller.address);
  console.log('Transaction hash:', seller.deployTransaction.hash);
  
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
  } catch (error) {
    console.error("Verification error:", error.message);
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    }
  }
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });