import { Module } from '@nestjs/common';
import { BlobService } from './blob.service';
import { StorageModule } from 'src/storage/storage.module';
import { BlobController } from './blob.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [StorageModule, DatabaseModule],
  providers: [BlobService],
  exports: [BlobService],
  controllers: [BlobController],
})
export class BlobModule {}
