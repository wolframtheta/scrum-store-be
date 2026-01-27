import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PeriodArticle } from './period-article.entity';

export enum PeriodRecurrence {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

@Entity('periods')
@Index(['supplierId', 'startDate'])
export class Period {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'date', name: 'delivery_date' })
  deliveryDate: Date;

  @Column({ type: 'enum', enum: PeriodRecurrence, default: PeriodRecurrence.CUSTOM })
  recurrence: PeriodRecurrence;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'transport_cost' })
  transportCost?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'transport_tax_rate' })
  transportTaxRate?: number;

  @OneToMany(() => PeriodArticle, periodArticle => periodArticle.period, { cascade: true })
  periodArticles: PeriodArticle[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

