import { IsString, IsNumber, MinLength, Min, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  barcode: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:|\/product-image\/)/, {
    message: 'imageUrl must be an http(s) URL, data URL, or product image path',
  })
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return 0;
    }
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  price: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return 0;
    }
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  stock: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  primaryCategory?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  subCategory?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  technicalTags?: string;
}

export class UpdateProductDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:|\/product-image\/)/, {
    message: 'imageUrl must be an http(s) URL, data URL, or product image path',
  })
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  stock?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  primaryCategory?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  subCategory?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    return value;
  })
  technicalTags?: string;
}
