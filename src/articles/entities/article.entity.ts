import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ConsumerGroup } from '../../consumer-groups/entities/consumer-group.entity';
import { Producer } from '../../producers/entities/producer.entity';

export enum UnitMeasure {
  G = 'g',
  KG = 'kg',
  ML = 'ml',
  CL = 'cl',
  L = 'l',
  UNIT = 'unit',
}

@Entity('articles')
@Index(['consumerGroupId', 'inShowcase'])
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  product: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variety?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'enum', enum: UnitMeasure, name: 'unit_measure' })
  unitMeasure: UnitMeasure;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_unit' })
  pricePerUnit: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ type: 'uuid', nullable: true, name: 'producer_id' })
  producerId?: string;

  @ManyToOne(() => Producer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'producer_id' })
  producer?: Producer;

  @Column({ type: 'boolean', default: false, name: 'is_eco' })
  isEco: boolean;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @Column({ type: 'boolean', default: false, name: 'in_showcase' })
  inShowcase: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_seasonal' })
  isSeasonal: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

