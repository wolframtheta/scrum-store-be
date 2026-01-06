import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CLIENT = 'client',
  PREPARER = 'preparer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  surname: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_image' })
  profileImage: string;

  @Column({ type: 'varchar', length: 255, select: false, name: 'password' })
  password: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    array: true,
    default: [UserRole.CLIENT] 
  })
  roles: UserRole[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

