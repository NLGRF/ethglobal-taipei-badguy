import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CctpController } from './cctp.controller';
import { CctpService } from './cctp.service';

@Module({
  imports: [ConfigModule],
  controllers: [CctpController],
  providers: [CctpService],
})
export class CctpModule {}
