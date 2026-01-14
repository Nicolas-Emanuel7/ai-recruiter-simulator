import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SimulateController } from './simulate/simulate.controller';
import { SimulateService } from './simulate/simulate.service';
import { PdfExtractService } from './simulate/pdf-extract.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, SimulateController],
  providers: [AppService, SimulateService, PdfExtractService],
})
export class AppModule {}
