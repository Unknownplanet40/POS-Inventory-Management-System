import { IsArray, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { SaleItem } from '../../../entities/sale.entity';

export class CreateSaleDto {
  @IsArray()
  items: SaleItem[];

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsEnum(['percentage', 'fixed', null])
  discountType?: 'percentage' | 'fixed' | null;

  @IsNumber()
  discountValue: number;

  @IsNumber()
  discountAmount: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsNumber()
  total: number;

  @IsString()
  cashierId: string;

  @IsString()
  cashierName: string;
}
