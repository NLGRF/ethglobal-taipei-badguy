import { ApiProperty } from '@nestjs/swagger';

export class EstimatedFeeEtherDto {
  @ApiProperty({
    description: 'Maximum fee per gas in Ether',
    example: '0.00000002045',
  })
  maxFeePerGas: string;

  @ApiProperty({
    description: 'Maximum priority fee per gas in Ether',
    example: '0.0000000015',
  })
  maxPriorityFeePerGas: string;

  @ApiProperty({
    description: 'Gas price in Ether (for legacy transactions)',
    example: '0.00000002132',
  })
  gasPrice: string;
}

export class GasFeeResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Estimated gas fees in Ether',
    type: EstimatedFeeEtherDto,
    required: false,
  })
  data?: EstimatedFeeEtherDto;

  @ApiProperty({
    description: 'Chain identifier',
    example: 'ethereum',
    required: false,
  })
  chainId?: string;

  @ApiProperty({
    description: 'Error message in case of failure',
    example: 'Failed to get gas fee estimates',
    required: false,
  })
  error?: string;
}

export class ChainOnlyRequestDto {
  @ApiProperty({
    description: 'Blockchain network',
    example: 'ethereum',
    required: true,
  })
  chain: string;
}

export class EstimateGasRequestDto extends ChainOnlyRequestDto {
  @ApiProperty({
    description: 'Sender address (default: 0x9Bb9fd0ab10f2c9231F2B0bb629ED446f0216c79)',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    required: false,
  })
  from?: string;

  @ApiProperty({
    description: 'Recipient address (default: 0x9Bb9fd0ab10f2c9231F2B0bb629ED446f0216c79)',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    required: false,
  })
  to?: string;

  @ApiProperty({
    description: 'Amount to send in ETH (default: 0.1)',
    example: '0.01',
    required: false,
  })
  value?: string;
}

export class EstimatedGasDataDto {
  @ApiProperty({
    description: 'Estimated gas amount',
    example: '21000',
  })
  estimatedGas: string;
}

export class EstimateGasResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Estimated gas data',
    type: EstimatedGasDataDto,
    required: false,
  })
  data?: EstimatedGasDataDto;

  @ApiProperty({
    description: 'Chain identifier',
    example: 'ethereum',
    required: false,
  })
  chainId?: string;

  @ApiProperty({
    description: 'Error message in case of failure',
    example: 'Failed to estimate gas',
    required: false,
  })
  error?: string;
}

export class GasCostDataDto {
  @ApiProperty({
    description: 'Estimated gas amount',
    example: '21000',
  })
  gasAmount: string;

  @ApiProperty({
    description: 'Gas price in Ether',
    example: '0.000000020',
  })
  gasPriceInEther: string;

  @ApiProperty({
    description: 'Maximum fee per gas in Ether',
    example: '0.000000025',
  })
  maxFeeInEther: string;

  @ApiProperty({
    description: 'Priority fee per gas in Ether',
    example: '0.000000001',
  })
  priorityFeeInEther: string;

  @ApiProperty({
    description: 'Total cost using legacy gas pricing (gas price * gas) in Ether',
    example: '0.00042',
  })
  totalCostLegacy: string;

  @ApiProperty({
    description: 'Minimum cost using EIP-1559 (priority fee * gas) in Ether',
    example: '0.000021',
  })
  totalCostEIP1559Min: string;

  @ApiProperty({
    description: 'Maximum cost using EIP-1559 (max fee * gas) in Ether',
    example: '0.000525',
  })
  totalCostEIP1559Max: string;
}

export class GasCostResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Gas cost data',
    type: GasCostDataDto,
    required: false,
  })
  data?: GasCostDataDto;

  @ApiProperty({
    description: 'Chain identifier',
    example: 'ethereum',
    required: false,
  })
  chainId?: string;

  @ApiProperty({
    description: 'Error message in case of failure',
    example: 'Failed to calculate gas cost',
    required: false,
  })
  error?: string;
} 