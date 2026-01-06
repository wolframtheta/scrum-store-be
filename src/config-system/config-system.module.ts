import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigSystemController } from './config-system.controller';
import { ConfigSystemService } from './config-system.service';
import { SystemConfig } from './entities/system-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig])],
  controllers: [ConfigSystemController],
  providers: [ConfigSystemService],
  exports: [ConfigSystemService],
})
export class ConfigSystemModule {}

