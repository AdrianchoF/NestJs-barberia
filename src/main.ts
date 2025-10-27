import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.use(cookieParser());

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector))
  );

  // Habilitar CORS para el frontend (Vite: 5173, Vue CLI: 8080)
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8080'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();