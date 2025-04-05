import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { CctpHistory } from './entities/cctp-history.entity';
import { DepositDto } from './dto/deposit.dto';
import { getChainConfig } from './utils/chain-config';
import { ConfigService } from '@nestjs/config';

// CCTP v2 Contract ABIs
const TOKEN_MESSENGER_ABI = [
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) external returns (uint64)',
  'function depositForBurnWithCaller(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller) external returns (uint64)'
];

const USDC_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)'
];

interface ChainConfig {
  rpc: string;
  tokenMessenger: string;
  usdcContract: string;
  domain: number;
}

interface TransferRequest {
  sourceChain: string;
  destinationChain: string;
  amount: number;
  sourceAddress: string;
  destinationAddress: string;
}

interface TransferStatus {
  transferId: string;
  status: 'pending' | 'completed' | 'failed';
  sourceChain: string;
  destinationChain: string;
  amount: number;
  sourceAddress: string;
  destinationAddress: string;
  timestamp: Date;
}

@Injectable()
export class CctpService {
  private transfers: Map<string, TransferStatus> = new Map();
  private chainConfigs: Record<string, ChainConfig> = {
    'Ethereum': {
      rpc: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
      tokenMessenger: '0xbd3fa81b58ba92a82136038b25adec7066af3155',
      usdcContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      domain: 0
    },
    'Base': {
      rpc: 'https://mainnet.base.org',
      tokenMessenger: '0x1682ae6375c4e4a97e4B583BC394c861A46D8962',
      usdcContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      domain: 6
    },
    'Polygon': {
      rpc: 'https://polygon-rpc.com',
      tokenMessenger: '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
      usdcContract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      domain: 7
    },
    'Celo': {
      rpc: 'https://forno.celo.org',
      tokenMessenger: '0xB3F7472B22708311BA99366AF7d9Ec45D96F3B76',
      usdcContract: '0x37f750B7cC259A2f741AF45294f6a16572CF5cAd',
      domain: 14
    },
    'Rootstock': {
      rpc: 'https://public-node.rsk.co',
      tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
      usdcContract: '0x8C25bA0557e55c7F86d3B53811d5A403fF2Ef949',
      domain: 30
    }
  };

  constructor(
    @InjectRepository(CctpHistory)
    private readonly historyRepo: Repository<CctpHistory>,
    private configService: ConfigService
  ) {}

  private getProvider(chain: string) {
    const config = this.chainConfigs[chain];
    if (!config) throw new Error(`Unsupported chain: ${chain}`);
    return new ethers.JsonRpcProvider(config.rpc);
  }

  private getTokenMessengerContract(chain: string, signer: ethers.Signer) {
    const config = this.chainConfigs[chain];
    return new ethers.Contract(config.tokenMessenger, TOKEN_MESSENGER_ABI, signer);
  }

  private getUsdcContract(chain: string, signer: ethers.Signer) {
    const config = this.chainConfigs[chain];
    return new ethers.Contract(config.usdcContract, USDC_ABI, signer);
  }

  async approveAndDepositForBurn(data: {
    sourceChain: string;
    destinationChain: string;
    amount: string;
    recipient: string;
    privateKey: string;
  }) {
    const {
      sourceChain,
      destinationChain,
      amount,
      recipient,
      privateKey
    } = data;

    const sourceConfig = this.chainConfigs[sourceChain];
    const destConfig = this.chainConfigs[destinationChain];
    if (!sourceConfig || !destConfig) {
      throw new Error('Invalid chain configuration');
    }

    // Setup provider and signer
    const provider = this.getProvider(sourceChain);
    const signer = new ethers.Wallet(privateKey, provider);

    // Get contracts
    const tokenMessenger = this.getTokenMessengerContract(sourceChain, signer);
    const usdc = this.getUsdcContract(sourceChain, signer);

    try {
      // 1. Approve USDC
      console.log('Approving USDC...');
      const approveTx = await usdc.approve(sourceConfig.tokenMessenger, amount);
      await approveTx.wait();
      console.log('USDC approved');

      // 2. Convert recipient address to bytes32
      const recipientBytes32 = ethers.zeroPadValue(recipient, 32);

      // 3. Deposit for burn
      console.log('Depositing for burn...');
      const depositTx = await tokenMessenger.depositForBurn(
        amount,
        destConfig.domain,
        recipientBytes32,
        sourceConfig.usdcContract
      );
      const receipt = await depositTx.wait();
      console.log('Deposit completed');

      return {
        transactionHash: receipt.hash,
        sourceChain,
        destinationChain,
        amount,
        recipient,
        status: 'completed'
      };
    } catch (error) {
      console.error('CCTP transaction failed:', error);
      throw error;
    }
  }

  async approveAndDepositForBurnWithCaller(data: {
    sourceChain: string;
    destinationChain: string;
    amount: string;
    recipient: string;
    destinationCaller: string;
    privateKey: string;
  }) {
    const {
      sourceChain,
      destinationChain,
      amount,
      recipient,
      destinationCaller,
      privateKey
    } = data;

    const sourceConfig = this.chainConfigs[sourceChain];
    const destConfig = this.chainConfigs[destinationChain];
    if (!sourceConfig || !destConfig) {
      throw new Error('Invalid chain configuration');
    }

    // Setup provider and signer
    const provider = this.getProvider(sourceChain);
    const signer = new ethers.Wallet(privateKey, provider);

    // Get contracts
    const tokenMessenger = this.getTokenMessengerContract(sourceChain, signer);
    const usdc = this.getUsdcContract(sourceChain, signer);

    try {
      // 1. Approve USDC
      console.log('Approving USDC...');
      const approveTx = await usdc.approve(sourceConfig.tokenMessenger, amount);
      await approveTx.wait();
      console.log('USDC approved');

      // 2. Convert addresses to bytes32
      const recipientBytes32 = ethers.zeroPadValue(recipient, 32);
      const callerBytes32 = ethers.zeroPadValue(destinationCaller, 32);

      // 3. Deposit for burn with caller
      console.log('Depositing for burn with caller...');
      const depositTx = await tokenMessenger.depositForBurnWithCaller(
        amount,
        destConfig.domain,
        recipientBytes32,
        sourceConfig.usdcContract,
        callerBytes32
      );
      const receipt = await depositTx.wait();
      console.log('Deposit completed');

      return {
        transactionHash: receipt.hash,
        sourceChain,
        destinationChain,
        amount,
        recipient,
        destinationCaller,
        status: 'completed'
      };
    } catch (error) {
      console.error('CCTP transaction failed:', error);
      throw error;
    }
  }

  async findAllHistory() {
    return this.historyRepo.find({ order: { createdAt: 'DESC' } });
  }

  async initiateTransfer(request: TransferRequest): Promise<TransferStatus> {
    const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transfer: TransferStatus = {
      transferId,
      status: 'pending',
      ...request,
      timestamp: new Date()
    };

    this.transfers.set(transferId, transfer);
    return transfer;
  }

  async getTransferHistory(address: string, chain?: string): Promise<TransferStatus[]> {
    const history = Array.from(this.transfers.values())
      .filter(transfer => 
        transfer.sourceAddress === address || 
        transfer.destinationAddress === address
      );

    if (chain) {
      return history.filter(transfer => 
        transfer.sourceChain === chain || 
        transfer.destinationChain === chain
      );
    }

    return history;
  }

  async getTransferStatus(transferId: string): Promise<TransferStatus | null> {
    return this.transfers.get(transferId) || null;
  }
}
