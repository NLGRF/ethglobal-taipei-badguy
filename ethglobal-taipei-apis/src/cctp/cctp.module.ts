import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CctpHistoryController } from './cctp-history.controller';
import { CctpHistoryService } from './cctp-history.service';
import { CctpHistory } from './entities/cctp-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CctpHistory])],
  controllers: [CctpHistoryController],
  providers: [CctpHistoryService],
})
export class CctpModule {}
