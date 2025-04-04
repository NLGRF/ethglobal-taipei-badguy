import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GasModule } from './modules/gas/gas.module';

@Module({
  imports: [GasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
