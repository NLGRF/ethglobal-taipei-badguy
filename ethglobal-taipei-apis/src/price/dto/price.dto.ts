import { ApiProperty } from '@nestjs/swagger';

export class PriceResponseDto {
  @ApiProperty({ description: 'Chain name', example: 'Ethereum' })
  chain: string;

  @ApiProperty({ description: 'Gas name', example: 'ETH' })
  gasName: string;

  @ApiProperty({ description: 'Price in USDC', example: 1792.67 })
  price: number;

  @ApiProperty({ description: 'Gas unit', example: 'GWEI' })
  gasUnit: string;

  @ApiProperty({ description: 'Gas amount in GWEI (1 USDC / ETH price)', example: 0.0005577 })
  gasAmount: number;

  @ApiProperty({ description: 'USDC price in USD', example: 1.0 })
  usdcPrice: number;
}

export class ConvertResponseDto {
  @ApiProperty({ description: 'Chain name', enum: ['Ethereum', 'Base', 'Linea'] })
  chain: string;

  @ApiProperty({ description: 'Input USDC amount', example: 20 })
  usdcAmount: number;

  @ApiProperty({ description: 'Equivalent ETH amount', example: 0.01115 })
  ethAmount: number;
} 