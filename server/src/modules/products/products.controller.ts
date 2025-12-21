import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Express } from 'express';

@Controller('api/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
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
          cb(null, `${random}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new Error('Only PNG, JPG, and JPEG images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createProduct(@Body() createProductDto: CreateProductDto, @UploadedFile() file?: Express.Multer.File) {
    return this.productsService.createProduct(createProductDto, file);
  }

  @Get('barcode/:barcode')
  async getProductByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.getProductByBarcode(barcode);
  }

  @Get()
  async getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
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
          cb(null, `${random}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new Error('Only PNG, JPG, and JPEG images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @UploadedFile() file?: Express.Multer.File) {
    return this.productsService.updateProduct(id, updateProductDto, file);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  @Put(':id/restore')
  async restoreProduct(@Param('id') id: string) {
    return this.productsService.restoreProduct(id);
  }

  @Delete(':id/permanent')
  async permanentlyDeleteProduct(@Param('id') id: string) {
    return this.productsService.permanentlyDeleteProduct(id);
  }
}
