import { ApiProperty } from '@nestjs/swagger';

export class PriceResponseDto {
  @ApiProperty({ description: 'Chain name', enum: ['Ethereum', 'Base', 'Linea'] })
  chain: string;

  @ApiProperty({ description: 'Gas token name', example: 'ETH' })
  gasName: string;

  @ApiProperty({ description: 'Price in USDC', example: 1792.67 })
  price: number;
}

export class ConvertResponseDto {
  @ApiProperty({ description: 'Chain name', enum: ['Ethereum', 'Base', 'Linea'] })
  chain: string;

  @ApiProperty({ description: 'Input USDC amount', example: 20 })
  usdcAmount: number;

  @ApiProperty({ description: 'Equivalent ETH amount', example: 0.01115 })
  ethAmount: number;
} 