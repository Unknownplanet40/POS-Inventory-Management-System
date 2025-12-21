import { Controller, Get, Post, Delete, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SettingsService } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  async saveSettings(@Body() data: {
    isSetupComplete?: boolean;
    storeName?: string;
    storeLogoUrl?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
    storeDescription?: string;
    currency?: string;
    taxRate?: number;
    categories?: string[];
  }) {
    return this.settingsService.saveSettings(data);
  }

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = join(process.cwd(), 'product image');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const random = Date.now();
          const ext = extname(file.originalname);
          cb(null, `store-logo-${random}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new Error('Only PNG, JPG, JPEG, and WEBP images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const url = `/product-image/${file.filename}`;
    return this.settingsService.updateLogoUrl(url);
  }

  @Delete('reset')
  async resetDatabase() {
    return this.settingsService.resetDatabase();
  }

  @Get('backup')
  async exportBackup() {
    return this.settingsService.exportBackup();
  }

  @Post('restore')
  async importBackup(@Body() data: any) {
    return this.settingsService.importBackup(data);
  }
}
