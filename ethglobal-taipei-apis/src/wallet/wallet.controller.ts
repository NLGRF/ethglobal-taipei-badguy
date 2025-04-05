import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  @Post('connect')
  @ApiOperation({ summary: 'Connect wallet' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string', example: '0x123...' },
        chainId: { type: 'number', example: 1 }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Wallet connected successfully' })
  async connectWallet(
    @Body('address') address: string,
    @Body('chainId') chainId: number
  ) {
    return {
      status: 'connected',
      address,
      chainId
    };
  }
} 