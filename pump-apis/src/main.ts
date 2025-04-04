import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Gas Estimation API')
    .setDescription(`
      API for estimating gas fees and transaction costs across various blockchains.
      
      ## Default Values
      
      When using endpoints with only the chain parameter:
      - Default address: 0x9Bb9fd0ab10f2c9231F2B0bb629ED446f0216c79
      - Default amount: 0.1 ETH
      
      ## Supported Chains
      
      - ethereum, ethereum_sepolia, ethereum_holesky
      - polygon, polygon_mumbai
      - base, base_sepolia
      - celo, celo_alfajores
      - linea, linea_sepolia
      - rootstock, rootstock_testnet
      - saga, saga_testnet
    `)
    .setVersion('1.0')
    .addTag('Gas Estimation', 'Endpoints for estimating gas fees and costs')
    .addBearerAuth() // Add if you plan to implement auth later
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api`);
}
bootstrap();
