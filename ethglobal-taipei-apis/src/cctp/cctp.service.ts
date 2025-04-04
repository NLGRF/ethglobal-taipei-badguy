import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { CctpHistory } from './entities/cctp-history.entity';
import { DepositDto } from './dto/deposit.dto';
import { getChainConfig } from './utils/chain-config';

const TokenMessengerABI = [
  'function depositForBurnWithCaller(uint256,uint32,bytes32,address,bytes32,uint256,uint32)'
];

@Injectable()
export class CctpService {
  constructor(
    @InjectRepository(CctpHistory)
    private readonly historyRepo: Repository<CctpHistory>,
  ) {}

  async depositForBurn(dto: DepositDto) {
    const chain = getChainConfig(dto.sourceChain);
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    const contract = new ethers.Contract(chain.tokenMessenger, TokenMessengerABI, wallet);
    const amount = ethers.parseUnits(dto.amount, 6);
    const recipient32 = ethers.zeroPadValue(dto.recipient, 32);
    const hook32 = ethers.zeroPadValue(dto.destinationCaller, 32);

    const tx = await contract.depositForBurnWithCaller(
      amount,
      dto.destinationDomain,
      recipient32,
      chain.usdc,
      hook32,
      0,
      1
    );

    await this.historyRepo.save({
      txHash: tx.hash,
      sourceChain: dto.sourceChain,
      destinationDomain: dto.destinationDomain,
      recipient: dto.recipient,
      amount: dto.amount,
      status: 'pending',
    });

    return { txHash: tx.hash };
  }

  async findAllHistory() {
    return this.historyRepo.find({ order: { createdAt: 'DESC' } });
  }
}
