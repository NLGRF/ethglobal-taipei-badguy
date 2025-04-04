import { Module } from '@nestjs/common';
import { CctpController } from './cctp.controller';
import { CctpService } from './cctp.service';

@Module({
  controllers: [CctpController],
  providers: [CctpService],
})
export class CctpModule {}
