import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

