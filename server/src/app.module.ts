import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { SettingsModule } from './modules/settings/settings.module';

// Determine database configuration based on environment
const getDatabaseConfig = () => {
  const isVercel = process.env.VERCEL === '1';
  
  // For Vercel: Use in-memory or PostgreSQL/MySQL
  // For local: Use SQLite
  if (isVercel) {
    return {
      type: 'sqlite' as const,
      database: ':memory:', // Use in-memory for now, or switch to PostgreSQL
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
      // Alternatively, use PostgreSQL for production:
      // type: 'postgres' as const,
      // host: process.env.DB_HOST || 'localhost',
      // port: parseInt(process.env.DB_PORT || '5432'),
      // username: process.env.DB_USER || 'postgres',
      // password: process.env.DB_PASSWORD,
      // database: process.env.DB_NAME || 'pos_system',
      // entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // synchronize: true,
      // logging: false,
    };
  }
  
  return {
    type: 'sqlite' as const,
    database: './pos-database.sqlite',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false,
  };
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'product image'),
      serveRoot: '/product-image',
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
