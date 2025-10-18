import { DatabaseModule } from 'src/database/database.module';
import { StorageFactory } from './storage.factory';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    StorageFactory,

    {
      provide: 'STORAGE_SERVICE',
      useFactory: (factory: StorageFactory) => {
        return factory.createStorageService();
      },
      inject: [StorageFactory],
    },
  ],
  exports: ['STORAGE_SERVICE'],
})
export class StorageModule {}
