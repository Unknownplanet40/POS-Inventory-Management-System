import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('products')
@Index(['barcode'], { unique: true })
@Index(['name'])
export class Product {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { unique: true })
  barcode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('integer')
  stock: number;

  @Column('varchar', { nullable: true })
  primaryCategory?: string | null;

  @Column('varchar', { nullable: true })
  subCategory?: string | null;

  @Column('text', { nullable: true })
  technicalTags?: string | null;

  @Column('varchar', { nullable: true })
  imageUrl?: string | null;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('datetime')
  createdAt: Date;

  @Column('datetime')
  updatedAt: Date;
}
