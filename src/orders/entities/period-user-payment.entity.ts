import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Period } from '../../periods/entities/period.entity';
import { ConsumerGroup } from '../../consumer-groups/entities/consumer-group.entity';

export enum PeriodPaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

@Entity('period_user_payments')
@Index(['periodId', 'userId', 'consumerGroupId'])
@Unique(['periodId', 'userId', 'consumerGroupId'])
export class PeriodUserPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'period_id' })
  periodId: string;

  @ManyToOne(() => Period, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period: Period;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @Column({ 
    type: 'enum', 
    enum: PeriodPaymentStatus, 
    default: PeriodPaymentStatus.UNPAID, 
    name: 'payment_status' 
  })
  paymentStatus: PeriodPaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount', default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
