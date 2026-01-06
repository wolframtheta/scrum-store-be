import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('group_invitations')
@Index(['token'], { unique: true })
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'uuid', name: 'consumer_group_id' })
  consumerGroupId: string;

  @Column({ type: 'varchar', length: 255, name: 'invited_by' })
  invitedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'invited_email' })
  invitedEmail?: string;

  @Column({ type: 'boolean', default: true, name: 'is_manager' })
  isManager: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_client' })
  isClient: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_preparer' })
  isPreparer: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_used' })
  isUsed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'used_by' })
  usedBy?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'used_at' })
  usedAt?: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}

