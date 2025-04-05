import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('CCTP API')
    .setDescription('CCTP and Price API documentation')
    .setVersion('1.0')
    .addTag('price')
    .addTag('cctp')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
