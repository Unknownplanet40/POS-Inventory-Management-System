import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { unique: true })
  username: string;

  @Column('varchar')
  passwordHash: string;

  @Column('varchar')
  role: 'admin' | 'cashier';

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('datetime')
  createdAt: Date;

  @Column('varchar', { nullable: true })
  activeSessionToken: string;

  @Column('datetime', { nullable: true })
  lastLoginAt: Date;
}
