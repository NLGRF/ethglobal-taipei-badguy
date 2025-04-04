import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PriceService } from './price.service';

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
  @ApiOperation({ summary: 'Get ETH price in USDC for all chains' })
  @ApiResponse({ status: 200, description: 'Returns ETH prices in USDC for all chains' })
  async getAllGasPrices() {
    const chains = ['Ethereum', 'Base', 'Linea'];
    const prices = await Promise.all(
      chains.map(chain => this.priceService.getGasPrice(chain))
    );
    return prices;
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
} 