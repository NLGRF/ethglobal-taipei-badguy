import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { 
  DeliveryEstimateRequestDto, 
  DeliveryResponseDto, 
  CoinTransferRequestDto 
} from './dto/delivery.dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('wait')
  @ApiOperation({ summary: 'Wait for a transaction to be mined with specified confirmations' })
  @ApiResponse({
    status: 200,
    description: 'Transaction delivery status',
    type: DeliveryResponseDto,
  })
  async waitForTransaction(
    @Body() body: DeliveryEstimateRequestDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.deliverTransaction(
      body.chain,
      body.txHash,
      body.confirmations,
      body.timeout,
    );
  }

  @Get('wait/:chain/:txHash')
  @ApiOperation({ summary: 'Wait for a transaction to be mined (GET endpoint)' })
  @ApiParam({ name: 'chain', description: 'Blockchain network name', example: 'ETH' })
  @ApiParam({ name: 'txHash', description: 'Transaction hash', example: '0x123...' })
  @ApiQuery({ name: 'confirmations', required: false, description: 'Number of confirmations to wait for', example: 1 })
  @ApiQuery({ name: 'timeout', required: false, description: 'Maximum waiting time in seconds', example: 60 })
  @ApiResponse({
    status: 200,
    description: 'Transaction delivery status',
    type: DeliveryResponseDto,
  })
  async waitForTransactionGet(
    @Param('chain') chain: string,
    @Param('txHash') txHash: string,
    @Query('confirmations') confirmations?: number,
    @Query('timeout') timeout?: number,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.deliverTransaction(
      chain,
      txHash,
      confirmations,
      timeout,
    );
  }

  @Get('status/:chain/:txHash')
  @ApiOperation({ summary: 'Get current status of a transaction' })
  @ApiParam({ name: 'chain', description: 'Blockchain network name', example: 'ETH' })
  @ApiParam({ name: 'txHash', description: 'Transaction hash', example: '0x123...' })
  @ApiResponse({
    status: 200,
    description: 'Transaction status',
    type: DeliveryResponseDto,
  })
  async getTransactionStatus(
    @Param('chain') chain: string,
    @Param('txHash') txHash: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.getTransactionStatus(chain, txHash);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer coins to a recipient using the gas seller contract' })
  @ApiResponse({
    status: 200,
    description: 'Transfer transaction details',
    type: DeliveryResponseDto,
  })
  async transferCoins(
    @Body() body: CoinTransferRequestDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.transferCoins(
      body.chain,
      body.recipient,
      body.amount,
      body.orderId,
    );
  }

  @Post('estimate-gas')
  @ApiOperation({ summary: 'Estimate gas for a coin transfer without sending the transaction' })
  @ApiResponse({
    status: 200,
    description: 'Gas estimation for the transfer',
    type: DeliveryResponseDto,
  })
  async estimateTransferGas(
    @Body() body: CoinTransferRequestDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.estimateTransferGas(
      body.chain,
      body.recipient,
      body.amount,
      body.orderId,
    );
  }

  @Get('transfer/:chain/:recipient/:amount/:orderId')
  @ApiOperation({ summary: 'Transfer coins to a recipient (GET endpoint)' })
  @ApiParam({ name: 'chain', description: 'Blockchain network name', example: 'ETH' })
  @ApiParam({ name: 'recipient', description: 'Recipient address', example: '0x1234...' })
  @ApiParam({ name: 'amount', description: 'Amount to transfer in ETH', example: '0.1' })
  @ApiParam({ name: 'orderId', description: 'Unique order ID', example: 'ORDER-123' })
  @ApiResponse({
    status: 200,
    description: 'Transfer transaction details',
    type: DeliveryResponseDto,
  })
  async transferCoinsGet(
    @Param('chain') chain: string,
    @Param('recipient') recipient: string,
    @Param('amount') amount: string,
    @Param('orderId') orderId: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.transferCoins(
      chain,
      recipient,
      parseFloat(amount),
      orderId,
    );
  }
} 