import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ConsumerGroup } from './consumer-group.entity';

@Entity('basket_schedule_assignments')
@Index(['consumerGroupId', 'date'], { unique: true })
export class BasketScheduleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @Column({ type: 'date', name: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255, name: 'assigned_user_email' })
  assignedUserEmail: string;
}
