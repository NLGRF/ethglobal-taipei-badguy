import { HttpException, HttpStatus } from '@nestjs/common';
import { Wallet, ethers, formatUnits, parseEther, parseUnits } from 'ethers';

import { Chain, getChainRPC, getGasSellerAddress } from '../constants/chain';

// For development, if PK_ADMIN is not in environment variables, use this default
// In production, use proper environment variables or secrets management
const DEFAULT_ADMIN_PK = 'ed9811219fab0ca17181ba86f7885406cfe8956472f6090e75f405c2a0482ebc';

class CoinSeller {
  private signer;
  private coinseller;
  private provider;
  private readonly adminPrivateKey: string;

  constructor(network: string, asset?: string) {
    // Get admin private key from environment variables or use default
    this.adminPrivateKey = process.env.PK_ADMIN || DEFAULT_ADMIN_PK;
    if (!this.adminPrivateKey) {
      console.warn('PK_ADMIN environment variable is not set. Using default key for development.');
      this.adminPrivateKey = DEFAULT_ADMIN_PK;
    }
    
    // Convert string network to Chain enum
    const chainKey = network.toUpperCase() as keyof typeof Chain;
    const chainValue = Chain[chainKey];
    
    if (!chainValue) {
      throw new Error(`Invalid chain: ${network}`);
    }
    
    this.provider = new ethers.JsonRpcProvider(
      getChainRPC(chainValue)
    );
    
    // Use provided asset address or get from chain configuration
    const contractAddress = asset || getGasSellerAddress(chainValue);
    
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      console.warn(`Warning: Using zero address for ${network}. Please update the address in chain.ts.`);
    }
    
    const wallet = new ethers.Wallet(this.adminPrivateKey);
    this.signer = wallet.connect(this.provider);
    this.coinseller = new ethers.Contract(contractAddress, this.escrowAbi, this.signer);
  }
  escrowAbi = [
    'function transfer(address recipient, uint256 amount, string orderId)',
    'event Transferred(address indexed relayer, address indexed recipient, uint256 amount, string orderId, uint256 timestamp)',
    'function orderIdUsed(string) view returns (bool)',
    'function getTransferLogs(uint256 page, uint256 limit) view returns ((address relayer, address recipient, uint256 amount, string orderId, uint256 timestamp)[])',
    'function transferLogs(uint256) view returns (address relayer, address recipient, uint256 amount, string orderId, uint256 timestamp)',
  ];

  async getSellerContract(
    network: string,
    escrowAddress?: string,
  ) {
    // Convert string network to Chain enum
    const chainKey = network.toUpperCase() as keyof typeof Chain;
    const chainValue = Chain[chainKey];
    
    if (!chainValue) {
      throw new Error(`Invalid chain: ${network}`);
    }
    
    const provider = new ethers.JsonRpcProvider(
      getChainRPC(chainValue)
    );
    
    // Use provided private key or fallback to admin key from environment
    const privateKey = this.adminPrivateKey;
    
    if (!privateKey) {
      throw new Error('Private key is required. Set PK_ADMIN in .env file or provide a private key.');
    }
    
    // Use provided escrow address or get from chain configuration
    const contractAddress = escrowAddress || getGasSellerAddress(chainValue);
    
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      console.warn(`Warning: Using zero address for ${network}. Please update the address in chain.ts.`);
    }
    
    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider);
    const seller = new ethers.Contract(contractAddress, this.escrowAbi, signer);

    return seller;
  }

  async estimateUsageGas(
    _recipient: string,
    _qauntity: number,
    _reforder: string,
  ) {
    const quantity = parseEther(_qauntity.toString());
    let estimation = await this.coinseller.transfer.estimateGas(
      _recipient,
      quantity,
      _reforder,
    );
    return estimation;
  }

  async coinTransferToBuyer(
    _recipient: string,
    _qauntity: number,
    _reforder: string,
  ) {
    const quantity = parseEther(_qauntity.toString());
    const gasprice = (await this.provider.getFeeData()).gasPrice;
    const estimation = await this.coinseller.transfer.estimateGas(
      _recipient,
      quantity,
      _reforder,
    );
    console.log(
      `gasprice: ${formatUnits(gasprice, 'gwei')}:: gasLimit ${estimation} unit`,
    );

    const txbuy = await this.coinseller.transfer(
      _recipient,
      quantity,
      _reforder,
      {
        gasLimit: estimation,
        gasPrice: gasprice,
      },
    );
    const txn = await txbuy.wait();
    console.log(txn);
    return {
      status: +txn.status == 1 ? true : false,
      hash: txn.hash,
    };
  }

  existOrder = async (_order: string) => {
    const isexist = await this.coinseller.orderIdUsed(_order);
    return isexist;
  };

  transferLogs = async (_id: number) => {
    const isexist = await this.coinseller.transferLogs(_id);
    return isexist;
  };
  getTransferLogs = async (_page: number, _limit: number) => {
    const logs = await this.coinseller.getTransferLogs(_page, _limit);
    return logs;
  };
}

export default CoinSeller;