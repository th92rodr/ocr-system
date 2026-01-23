import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT')!;

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization',
  });

  const openApiDocumentOptions = new DocumentBuilder()
    .setTitle('OCR System API')
    .setDescription('API documentation for the OCR System')
    .setVersion('1.0')
    .build();
  const openApiObject = SwaggerModule.createDocument(app, openApiDocumentOptions);
  SwaggerModule.setup('api/docs', app, openApiObject);

  await app.listen(port);
}
bootstrap();
