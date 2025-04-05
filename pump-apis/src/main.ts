// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Blockchain Services API')
    .setDescription(`
      API for estimating gas fees, transaction costs, and handling transaction delivery across various blockchains.
      
      ## Gas Estimation
      
      Default Values when using endpoints with only the chain parameter:
      - Default address: 0x9Bb9fd0ab10f2c9231F2B0bb629ED446f0216c79
      - Default amount: 0.1 ETH
      
      ## Transaction Delivery
      
      The delivery service provides endpoints to:
      - Wait for a transaction to be mined with specified confirmations
      - Check the current status of a transaction
      - Transfer coins using the gas seller contract
      - Estimate gas for coin transfers
      
      ## Coin Transfer
      
      The coin transfer functionality uses configured contract addresses for each chain. 
      To update contract addresses for specific chains, modify the getGasSellerAddress function 
      in the chain.ts file.
      
      ## Supported Chains
      
      - ethereum, ethereum_sepolia
      - polygon, polygon_amoy
      - base, base_sepolia
      - celo, celo_alfajores
      - linea, linea_sepolia
      - rootstock, rootstock_testnet
    `)
    .setVersion('1.0')
    .addTag('Gas Estimation', 'Endpoints for estimating gas fees and costs')
    .addTag('Transaction Delivery', 'Endpoints for transaction delivery and status checking')
    .addBearerAuth() // Add if you plan to implement auth later
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api`);
}
bootstrap();
