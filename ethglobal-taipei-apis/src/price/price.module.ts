import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';

@Module({
  imports: [ConfigModule],
  controllers: [PriceController],
  providers: [PriceService],
})
export class PriceModule {} 