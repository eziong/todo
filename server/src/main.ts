import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Response envelope
  app.useGlobalInterceptors(new TransformInterceptor());

  // Error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS — personal app, allow all origins
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
