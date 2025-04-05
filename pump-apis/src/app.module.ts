import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GasModule } from './modules/gas/gas.module';
import { DeliveryModule } from './modules/delivery/delivery.module';

@Module({
  imports: [GasModule, DeliveryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
