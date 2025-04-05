import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { PriceService } from './price.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('price')
@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get()
  @ApiOperation({ summary: 'Get gas price for all chains' })
  @ApiQuery({ name: 'amount', required: false, type: Number, description: 'Amount in USDC (default: 1)' })
  @ApiResponse({ status: 200, description: 'Returns gas prices for all chains' })
  async getAllGasPrices(@Query('amount') amount: number = 1) {
    const prices = await this.priceService.getAllGasPrices();
    const result = Object.entries(prices).map(([chain, price]) => ({
      chain,
      gasName: this.priceService.getGasName(chain),
      price,
      gasUnit: 'GWEI',
      gasAmount: price > 0 ? amount / price : 0,
      usdcPrice: 1
    }));
    return result;
  }

  @Get('gas/:chain')
  @ApiOperation({ summary: 'Get gas price for specific chain' })
  @ApiQuery({ name: 'chain', required: true, description: 'Chain name' })
  @ApiResponse({ status: 200, description: 'Returns gas price for the specified chain' })
  async getGasPrice(@Query('chain') chain: string) {
    const price = await this.priceService.getGasPrice(chain);
    return {
      chain,
      gasName: this.priceService.getGasName(chain),
      price,
      gasUnit: 'GWEI',
      gasAmount: price > 0 ? 1 / price : 0,
      usdcPrice: 1
    };
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert USDC to ETH' })
  @ApiResponse({ status: 200, description: 'Returns converted amount in ETH' })
  async convertUsdcToEth(@Body('amount') amount: number) {
    return this.priceService.convertUsdcToEth(amount);
  }
} 