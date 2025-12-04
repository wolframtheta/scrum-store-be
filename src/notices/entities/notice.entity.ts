import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConsumerGroup } from '../../consumer-groups/entities/consumer-group.entity';

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ name: 'authorEmail' })
  authorEmail: string;

  @ManyToOne(() => ConsumerGroup, { eager: true })
  @JoinColumn({ name: 'groupId' })
  group: ConsumerGroup;

  @Column({ name: 'groupId' })
  groupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
