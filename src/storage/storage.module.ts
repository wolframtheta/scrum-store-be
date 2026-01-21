import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ImageSearchService } from './image-search.service';

@Module({
  providers: [StorageService, ImageSearchService],
  exports: [StorageService, ImageSearchService],
})
export class StorageModule {}

