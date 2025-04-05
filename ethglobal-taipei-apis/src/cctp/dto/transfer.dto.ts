import { ApiProperty } from '@nestjs/swagger';

export class TransferRequestDto {
  @ApiProperty({ description: 'Source chain name', example: 'Ethereum' })
  sourceChain: string;

  @ApiProperty({ description: 'Destination chain name', example: 'Base' })
  destinationChain: string;

  @ApiProperty({ description: 'Amount to transfer', example: 10 })
  amount: number;

  @ApiProperty({ description: 'Source wallet address', example: '0x123...' })
  sourceAddress: string;

  @ApiProperty({ description: 'Destination wallet address', example: '0x456...' })
  destinationAddress: string;
}

export class TransferStatusDto {
  @ApiProperty({ description: 'Transfer ID', example: 'transfer_1234567890_abc123' })
  transferId: string;

  @ApiProperty({ description: 'Transfer status', enum: ['pending', 'completed', 'failed'] })
  status: 'pending' | 'completed' | 'failed';

  @ApiProperty({ description: 'Source chain name', example: 'Ethereum' })
  sourceChain: string;

  @ApiProperty({ description: 'Destination chain name', example: 'Base' })
  destinationChain: string;

  @ApiProperty({ description: 'Amount being transferred', example: 10 })
  amount: number;

  @ApiProperty({ description: 'Source wallet address', example: '0x123...' })
  sourceAddress: string;

  @ApiProperty({ description: 'Destination wallet address', example: '0x456...' })
  destinationAddress: string;

  @ApiProperty({ description: 'Transfer timestamp' })
  timestamp: Date;
} 