import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryColumn('varchar')
  id: string;

  @Column('boolean')
  isSetupComplete: boolean;

  @Column('varchar', { default: 'Store' })
  storeName: string;

  @Column('varchar', { nullable: true })
  storeLogoUrl?: string;

  @Column('varchar', { nullable: true })
  storeEmail?: string;

  @Column('varchar', { nullable: true })
  storePhone?: string;

  @Column('varchar', { nullable: true })
  storeAddress?: string;

  @Column('varchar', { nullable: true })
  storeDescription?: string;

  @Column('varchar', { default: 'PHP' })
  currency: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  taxRate?: number;

  @Column('simple-json', { nullable: true })
  categories?: string[];

  @Column('simple-json', { nullable: true })
  technicalTags?: string[];
}
