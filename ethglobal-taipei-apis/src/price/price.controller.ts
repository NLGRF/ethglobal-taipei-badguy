import { Controller, Get, Post, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { PriceResponseDto } from './dto/price.dto';

@ApiTags('price')
@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get(':chain')
  @ApiOperation({ summary: 'Get ETH price in USDC for a specific chain' })
  @ApiParam({ name: 'chain', enum: ['Ethereum', 'Base', 'Linea'] })
  @ApiResponse({ status: 200, description: 'Returns ETH price in USDC' })
  async getGasPrice(@Param('chain') chain: string) {
    return this.priceService.getGasPrice(chain);
  }

  @Get()
  @ApiOperation({ summary: 'Get gas prices for all chains' })
  @ApiQuery({ name: 'amount', required: false, type: Number, description: 'Amount in USDC (default: 1)' })
  @ApiResponse({ status: 200, description: 'Returns gas prices for all chains', type: [PriceResponseDto] })
  async getAllGasPrices(@Query('amount') amount?: string): Promise<PriceResponseDto[]> {
    const usdcAmount = amount ? parseFloat(amount) : 1;
    if (isNaN(usdcAmount) || usdcAmount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    return this.priceService.getAllGasPrices(usdcAmount);
  }

  @Get(':chain/convert')
  @ApiOperation({ summary: 'Convert USDC to ETH for a specific chain' })
  @ApiParam({ name: 'chain', enum: ['Ethereum', 'Base', 'Linea'] })
  @ApiQuery({ name: 'amount', type: 'number', description: 'Amount of USDC to convert' })
  @ApiResponse({ status: 200, description: 'Returns equivalent ETH amount' })
  async convertUsdcToEth(
    @Param('chain') chain: string,
    @Query('amount') amount: string,
  ) {
    const usdcAmount = parseFloat(amount);
    if (isNaN(usdcAmount)) {
      throw new Error('Invalid USDC amount');
    }
    return this.priceService.convertUsdcToEth(chain, usdcAmount);
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convert USDC to ETH for all chains' })
  @ApiQuery({ name: 'amount', type: 'number', description: 'Amount of USDC to convert' })
  @ApiResponse({ status: 200, description: 'Returns equivalent ETH amounts for all chains' })
  async convertUsdcToEthAllChains(@Query('amount') amount: string) {
    const usdcAmount = parseFloat(amount);
    if (isNaN(usdcAmount)) {
      throw new Error('Invalid USDC amount');
    }
    return this.priceService.convertUsdcToEthAllChains(usdcAmount);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm transaction with selected chain and amount' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', example: 'Ethereum' },
        amount: { type: 'number', example: 10 },
        address: { type: 'string', example: '0x123...' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Transaction confirmed' })
  async confirmTransaction(
    @Body('chain') chain: string,
    @Body('amount') amount: number,
    @Body('address') address: string
  ) {
    const price = await this.priceService.getGasPrice(chain, amount);
    return {
      status: 'confirmed',
      chain,
      amount,
      address,
      ethAmount: price.gasAmount,
      price: price.price
    };
  }
} 