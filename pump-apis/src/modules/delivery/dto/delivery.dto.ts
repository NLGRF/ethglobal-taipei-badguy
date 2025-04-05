import { ApiProperty } from '@nestjs/swagger';

export class DeliveryEstimateRequestDto {
  @ApiProperty({
    description: 'Blockchain network',
    example: 'ethereum',
    required: true,
  })
  chain: string;

  @ApiProperty({
    description: 'Transaction hash to deliver',
    example: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    required: true,
  })
  txHash: string;

  @ApiProperty({
    description: 'Number of confirmations required (default: 1)',
    example: 3,
    required: false,
  })
  confirmations?: number;

  @ApiProperty({
    description: 'Maximum waiting time in seconds (default: 60)',
    example: 120,
    required: false,
  })
  timeout?: number;
}

export class CoinTransferRequestDto {
  @ApiProperty({
    description: 'Blockchain network',
    example: 'ethereum',
    required: true,
  })
  chain: string;

  @ApiProperty({
    description: 'Recipient address',
    example: '0x1234567890123456789012345678901234567890',
    required: true,
  })
  recipient: string;

  @ApiProperty({
    description: 'Amount to transfer in ETH',
    example: 0.1,
    required: true,
  })
  amount: number;

  @ApiProperty({
    description: 'Unique order ID for the transfer',
    example: 'ORDER-123456',
    required: true,
  })
  orderId: string;
}

export class DeliveryStatusDto {
  @ApiProperty({
    description: 'Transaction hash',
    example: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  })
  txHash: string;

  @ApiProperty({
    description: 'Current status of the transaction',
    example: 'confirmed',
    enum: ['pending', 'confirmed', 'failed', 'timeout', 'estimation'],
  })
  status: string;

  @ApiProperty({
    description: 'Number of confirmations received',
    example: 3,
  })
  confirmations: number;

  @ApiProperty({
    description: 'Block number where transaction was included',
    example: '12345678',
    required: false,
  })
  blockNumber?: string;

  @ApiProperty({
    description: 'Time when transaction was mined (ISO format)',
    example: '2023-04-04T12:34:56Z',
    required: false,
  })
  minedAt?: string;

  @ApiProperty({
    description: 'Gas estimate for the transaction (only for estimation requests)',
    example: '21000',
    required: false,
  })
  gasEstimate?: string;
}

export class DeliveryResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Delivery status data',
    type: DeliveryStatusDto,
    required: false,
  })
  data?: DeliveryStatusDto;

  @ApiProperty({
    description: 'Chain identifier',
    example: 'ethereum',
    required: false,
  })
  chainId?: string;

  @ApiProperty({
    description: 'Error message in case of failure',
    example: 'Transaction not found',
    required: false,
  })
  error?: string;
} 