import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ConsumerGroup } from './consumer-group.entity';

export type BasketScheduleVoteStatus = 'yes' | 'no' | 'if_needed';

@Entity('basket_schedule_votes')
@Index(['consumerGroupId', 'userEmail', 'date'], { unique: true })
export class BasketScheduleVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @Column({ type: 'varchar', length: 255, name: 'user_email' })
  userEmail: string;

  /** Date only (no time), stored as YYYY-MM-DD or date type */
  @Column({ type: 'date', name: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 20, name: 'status' })
  status: BasketScheduleVoteStatus;
}
