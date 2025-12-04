import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'user_email' })
  userEmail: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_email', referencedColumnName: 'email' })
  user: User;

  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}

