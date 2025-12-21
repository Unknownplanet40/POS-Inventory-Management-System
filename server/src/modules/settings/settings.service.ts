import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { unlink, readdir, readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../../entities/settings.entity';
import { Product } from '../../entities/product.entity';
import { Sale } from '../../entities/sale.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getSettings() {
    let settings = await this.settingsRepository.findOne({
      where: { id: 'app-settings' },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        id: 'app-settings',
        isSetupComplete: false,
        storeName: 'Store',
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async saveSettings(data: {
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
    let settings = await this.settingsRepository.findOne({
      where: { id: 'app-settings' },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        id: 'app-settings',
        isSetupComplete: data.isSetupComplete || false,
        storeName: data.storeName || 'Store',
        storeLogoUrl: data.storeLogoUrl,
        storeEmail: data.storeEmail,
        storePhone: data.storePhone,
        storeAddress: data.storeAddress,
        storeDescription: data.storeDescription,
        currency: data.currency || 'PHP',
        taxRate: data.taxRate,
        categories: data.categories,
      });
    } else {
      if (data.isSetupComplete !== undefined) settings.isSetupComplete = data.isSetupComplete;
      if (data.storeName !== undefined) settings.storeName = data.storeName;
      if (data.storeLogoUrl !== undefined) settings.storeLogoUrl = data.storeLogoUrl;
      if (data.storeEmail !== undefined) settings.storeEmail = data.storeEmail;
      if (data.storePhone !== undefined) settings.storePhone = data.storePhone;
      if (data.storeAddress !== undefined) settings.storeAddress = data.storeAddress;
      if (data.storeDescription !== undefined) settings.storeDescription = data.storeDescription;
      if (data.currency !== undefined) settings.currency = data.currency || 'PHP';
      if (data.taxRate !== undefined) settings.taxRate = data.taxRate;
      if (data.categories !== undefined) settings.categories = data.categories;
    }

    return this.settingsRepository.save(settings);
  }

  async resetDatabase() {
    try {
      // Delete all data from tables in correct order (respecting foreign keys)
      await this.saleRepository.clear();
      await this.productRepository.clear();
      await this.userRepository.clear();
      await this.settingsRepository.clear();
      
      // Delete all product images
      const productImagesPath = join(process.cwd(), 'product image');
      try {
        if (existsSync(productImagesPath)) {
          const files = await readdir(productImagesPath);
          for (const file of files) {
            try {
              await unlink(join(productImagesPath, file));
            } catch (err) {
              console.error(`Failed to delete image ${file}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to delete product images:', err);
      }
      
      // Recreate initial settings
      const settings = this.settingsRepository.create({
        id: 'app-settings',
        isSetupComplete: false,
        storeName: 'Store',
      });
      await this.settingsRepository.save(settings);
      
      return { message: 'Database reset successfully' };
    } catch (error) {
      throw new Error('Failed to reset database: ' + error.message);
    }
  }

  async updateLogoUrl(newUrl: string) {
    let settings = await this.settingsRepository.findOne({ where: { id: 'app-settings' } });
    if (!settings) {
      settings = this.settingsRepository.create({ id: 'app-settings', isSetupComplete: false, storeName: 'Store' });
    }

    // Delete old local file if replacing a previous local logo
    if (settings.storeLogoUrl && settings.storeLogoUrl.startsWith('/product-image/')) {
      try {
        const filePath = settings.storeLogoUrl.replace('/product-image/', '');
        const fullPath = join(process.cwd(), 'product image', filePath);
        await unlink(fullPath);
      } catch {
        // ignore
      }
    }

    settings.storeLogoUrl = newUrl;
    await this.settingsRepository.save(settings);
    return { storeLogoUrl: settings.storeLogoUrl };
  }

  async exportBackup() {
    const users = await this.userRepository.find();
    const products = await this.productRepository.find();
    const sales = await this.saleRepository.find();
    const settings = await this.settingsRepository.findOne({ where: { id: 'app-settings' } });

    // Read and encode product images
    const productImagesPath = join(process.cwd(), 'product image');
    const images: { filename: string; data: string }[] = [];

    try {
      if (existsSync(productImagesPath)) {
        const files = await readdir(productImagesPath);
        for (const file of files) {
          try {
            const filePath = join(productImagesPath, file);
            const fileData = await readFile(filePath);
            const base64Data = fileData.toString('base64');
            images.push({ filename: file, data: base64Data });
          } catch (err) {
            console.error(`Failed to read image ${file}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to read product images directory:', err);
    }

    return {
      users,
      products,
      sales,
      settings,
      images,
      exportedAt: new Date().toISOString(),
    };
  }

  async importBackup(data: {
    users: User[];
    products: Product[];
    sales: Sale[];
    settings?: Settings;
    images?: { filename: string; data: string }[];
  }) {
    try {
      // Clear existing data first
      await this.saleRepository.clear();
      await this.productRepository.clear();
      await this.userRepository.clear();
      await this.settingsRepository.clear();

      // Clear and restore product images
      const productImagesPath = join(process.cwd(), 'product image');
      try {
        // Delete existing images
        if (existsSync(productImagesPath)) {
          const files = await readdir(productImagesPath);
          for (const file of files) {
            try {
              await unlink(join(productImagesPath, file));
            } catch (err) {
              console.error(`Failed to delete image ${file}:`, err);
            }
          }
        } else {
          // Create directory if it doesn't exist
          mkdirSync(productImagesPath, { recursive: true });
        }

        // Restore images from backup
        if (data.images?.length) {
          for (const image of data.images) {
            try {
              const imageBuffer = Buffer.from(image.data, 'base64');
              await writeFile(join(productImagesPath, image.filename), imageBuffer);
            } catch (err) {
              console.error(`Failed to restore image ${image.filename}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore product images:', err);
      }

      // Restore settings
      if (data.settings) {
        await this.settingsRepository.save({
          ...data.settings,
          isSetupComplete: data.settings.isSetupComplete ?? false,
          storeName: data.settings.storeName || 'Store',
        });
      } else {
        await this.settingsRepository.save({
          id: 'app-settings',
          isSetupComplete: false,
          storeName: 'Store',
        });
      }

      // Restore users
      if (data.users?.length) {
        const users = data.users.map((u) => ({
          ...u,
          role: u.role || 'cashier',
          isActive: u.isActive ?? true,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        }));

        // Ensure all users include passwordHash
        const missingPassword = users.find((u) => !u.passwordHash);
        if (missingPassword) {
          throw new Error('Backup is missing passwordHash for one or more users. Import aborted.');
        }

        await this.userRepository.save(users);
      }

      // Restore products
      if (data.products?.length) {
        const products = data.products.map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        await this.productRepository.save(products);
      }

      // Restore sales
      if (data.sales?.length) {
        const sales = data.sales.map((s) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        }));
        await this.saleRepository.save(sales);
      }

      return { message: 'Backup restored successfully' };
    } catch (error) {
      throw new Error('Failed to import backup: ' + error.message);
    }
  }
}
