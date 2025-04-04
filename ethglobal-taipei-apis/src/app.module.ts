import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CctpModule } from './cctp/cctp.module';

@Module({
  imports: [CctpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
