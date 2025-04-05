import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CctpService } from './cctp.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferRequestDto, TransferStatusDto } from './dto/transfer.dto';

@ApiTags('cctp')
@Controller('cctp')
export class CctpController {
  constructor(private readonly cctpService: CctpService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit USDC for burn' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceChain: { type: 'string', example: 'Ethereum' },
        destinationChain: { type: 'string', example: 'Base' },
        amount: { type: 'string', example: '1000000' },
        recipient: { type: 'string', example: '0x123...' },
        privateKey: { type: 'string', example: '0xabc...' }
      },
      required: ['sourceChain', 'destinationChain', 'amount', 'recipient', 'privateKey']
    }
  })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  async depositForBurn(
    @Body('sourceChain') sourceChain: string,
    @Body('destinationChain') destinationChain: string,
    @Body('amount') amount: string,
    @Body('recipient') recipient: string,
    @Body('privateKey') privateKey: string
  ) {
    if (!amount || isNaN(Number(amount))) {
      throw new BadRequestException('Invalid amount');
    }

    return this.cctpService.approveAndDepositForBurn({
      sourceChain,
      destinationChain,
      amount,
      recipient,
      privateKey
    });
  }

  @Post('deposit-with-caller')
  @ApiOperation({ summary: 'Deposit USDC for burn with destination caller' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceChain: { type: 'string', example: 'Ethereum' },
        destinationChain: { type: 'string', example: 'Base' },
        amount: { type: 'string', example: '1000000' },
        recipient: { type: 'string', example: '0x123...' },
        destinationCaller: { type: 'string', example: '0x456...' },
        privateKey: { type: 'string', example: '0xabc...' }
      },
      required: ['sourceChain', 'destinationChain', 'amount', 'recipient', 'destinationCaller', 'privateKey']
    }
  })
  @ApiResponse({ status: 200, description: 'Deposit with caller successful' })
  async depositForBurnWithCaller(
    @Body('sourceChain') sourceChain: string,
    @Body('destinationChain') destinationChain: string,
    @Body('amount') amount: string,
    @Body('recipient') recipient: string,
    @Body('destinationCaller') destinationCaller: string,
    @Body('privateKey') privateKey: string
  ) {
    if (!amount || isNaN(Number(amount))) {
      throw new BadRequestException('Invalid amount');
    }

    return this.cctpService.approveAndDepositForBurnWithCaller({
      sourceChain,
      destinationChain,
      amount,
      recipient,
      destinationCaller,
      privateKey
    });
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Initiate CCTP transfer' })
  @ApiBody({ type: TransferRequestDto })
  @ApiResponse({ status: 200, description: 'Transfer initiated successfully', type: TransferStatusDto })
  async initiateTransfer(@Body() request: TransferRequestDto): Promise<TransferStatusDto> {
    if (request.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    return this.cctpService.initiateTransfer(request);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get CCTP transfer history' })
  @ApiQuery({ name: 'address', required: true, type: String })
  @ApiQuery({ name: 'chain', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Transfer history retrieved', type: [TransferStatusDto] })
  async getTransferHistory(
    @Query('address') address: string,
    @Query('chain') chain?: string
  ): Promise<TransferStatusDto[]> {
    return this.cctpService.getTransferHistory(address, chain);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get CCTP transfer status' })
  @ApiQuery({ name: 'transferId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Transfer status retrieved', type: TransferStatusDto })
  async getTransferStatus(
    @Query('transferId') transferId: string
  ): Promise<TransferStatusDto | null> {
    return this.cctpService.getTransferStatus(transferId);
  }
}
