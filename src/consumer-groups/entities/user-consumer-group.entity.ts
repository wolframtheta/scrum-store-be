import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ConsumerGroup } from './consumer-group.entity';

@Entity('user_consumer_groups')
@Index(['userEmail', 'consumerGroupId'], { unique: true })
export class UserConsumerGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'user_email' })
  userEmail: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_email', referencedColumnName: 'email' })
  user: User;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @ManyToOne(() => ConsumerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_group_id' })
  consumerGroup: ConsumerGroup;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_client' })
  isClient: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_manager' })
  isManager: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_preparer' })
  isPreparer: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'joined_at' })
  joinedAt: Date;
}

