import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ConsumerGroup } from '../../consumer-groups/entities/consumer-group.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  postalCode?: string;

  @Column({ type: 'text', nullable: true })
  bankAccount?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

