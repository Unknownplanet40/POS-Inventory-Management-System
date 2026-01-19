import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  // Increase body size limit for image uploads
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true, // Allow all origins (adjust for production)
    credentials: true,
  });

  // Use validation pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Listen on all network interfaces
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Access from network devices using your local IP address`);
}

// Only bootstrap if not in Vercel serverless environment
if (!process.env.VERCEL) {
  bootstrap();
}

