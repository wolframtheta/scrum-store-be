import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ConsumerGroup } from './consumer-group.entity';

@Entity('basket_schedule_config')
export class BasketScheduleConfig {
  @PrimaryColumn({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  /** Preferred weekday for preparation (0 = Sunday, 1 = Monday, ... 6 = Saturday). Null = not set */
  @Column({ type: 'smallint', nullable: true, name: 'preferred_weekday' })
  preferredWeekday: number | null;

  /** Preferred time to meet (e.g. "10:00"). Null = not set */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'preferred_time' })
  preferredTime: string | null;
}
