import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ConsumerGroup } from '../../consumer-groups/entities/consumer-group.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  product?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variety?: string;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

