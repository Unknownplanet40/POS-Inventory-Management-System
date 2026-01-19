import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from '../server/src/app.module';

let app: Express;
let nestApp;

async function createNestApp(): Promise<Express> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  nestApp = await NestFactory.create(AppModule, adapter, {
    bodyParser: true,
    rawBody: false,
  });

  // Middleware
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS
  nestApp.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global pipes
  nestApp.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );

  await nestApp.init();
  return expressApp;
}

// Vercel serverless handler
export default async (req: any, res: any) => {
  // Initialize app on first request
  if (!app) {
    app = await createNestApp();
  }

  // Handle the request
  return app(req, res);
};

// Also export for potential ESM modules
export const handler = async (req: any, res: any) => {
  if (!app) {
    app = await createNestApp();
  }
  return app(req, res);
};

