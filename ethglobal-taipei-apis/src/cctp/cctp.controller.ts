import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CctpService } from './cctp.service';
import { DepositDto } from './dto/deposit.dto';

@ApiTags('cctp')
@Controller('cctp')
export class CctpController {
  constructor(private readonly cctpService: CctpService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Call depositForBurnWithCaller' })
  async deposit(@Body() dto: DepositDto) {
    return this.cctpService.depositForBurn(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get all transaction history' })
  async history() {
    return this.cctpService.findAllHistory();
  }
}
