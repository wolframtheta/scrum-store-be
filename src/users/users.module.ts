import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users-admin.controller';
import { UsersAdminExtendedController } from './users-admin-extended.controller';
import { User } from './entities/user.entity';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CoreModule
  ],
  controllers: [
    UsersController,
    UsersAdminController,
    UsersAdminExtendedController,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

