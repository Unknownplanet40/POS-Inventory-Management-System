import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async createProduct(createProductDto: CreateProductDto, file?: Express.Multer.File) {
    const existingProduct = await this.productRepository.findOne({
      where: { barcode: createProductDto.barcode },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this barcode already exists');
    }

    const imageUrl = file ? this.buildImageUrl(file.filename) : createProductDto.imageUrl ?? null;

    const product = this.productRepository.create({
      id: uuidv4(),
      ...createProductDto,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.productRepository.save(product);
  }

  async getProductByBarcode(barcode: string) {
    const product = await this.productRepository.findOne({
      where: { barcode },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getAllProducts() {
    return this.productRepository.find();
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.getProductById(id);
    const previousImage = product.imageUrl;

    Object.assign(product, updateProductDto);
    if (file) {
      product.imageUrl = this.buildImageUrl(file.filename);
      if (previousImage && previousImage.startsWith('/product-image/')) {
        await this.safeDelete(previousImage);
      }
    } else if (updateProductDto.imageUrl === undefined) {
      // keep existing
    } else if (updateProductDto.imageUrl === null) {
      product.imageUrl = null;
      if (previousImage && previousImage.startsWith('/product-image/')) {
        await this.safeDelete(previousImage);
      }
    }
    
    // Auto-archive if stock reaches 0
    if (product.stock <= 0) {
      product.isActive = false;
    }
    
    product.updatedAt = new Date();

    return this.productRepository.save(product);
  }

  async deleteProduct(id: string) {
    // Soft delete - archive the product
    const product = await this.getProductById(id);
    product.isActive = false;
    product.updatedAt = new Date();
    await this.productRepository.save(product);
    return { message: 'Product archived successfully' };
  }

  async restoreProduct(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    product.isActive = true;
    product.updatedAt = new Date();
    return this.productRepository.save(product);
  }

  async permanentlyDeleteProduct(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.imageUrl && product.imageUrl.startsWith('/product-image/')) {
      await this.safeDelete(product.imageUrl);
    }
    await this.productRepository.delete(id);
    return { message: 'Product permanently deleted' };
  }

  private buildImageUrl(filename: string) {
    return `/product-image/${filename}`;
  }

  private async safeDelete(imageUrl: string) {
    try {
      const filePath = imageUrl.replace('/product-image/', '');
      const fullPath = join(process.cwd(), 'product image', filePath);
      await unlink(fullPath);
    } catch {
      // ignore if file already missing
    }
  }
}
