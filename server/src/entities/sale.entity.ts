import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Entity('sales')
@Index(['createdAt'])
@Index(['cashierId'])
export class Sale {
  @PrimaryColumn('varchar')
  id: string;

  @Column('simple-json')
  items: SaleItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('varchar', { nullable: true })
  discountType: 'percentage' | 'fixed' | null;

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('varchar')
  cashierId: string;

  @Column('varchar')
  cashierName: string;

  @Column('datetime')
  createdAt: Date;
}
