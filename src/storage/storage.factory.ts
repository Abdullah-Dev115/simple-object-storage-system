import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { IStorageService } from './storage.interface';
import { S3Adapter } from './adapters/s3.adapter';
import { DatabaseAdapter } from './adapters/database.adapter';
import { LocalStorageAdapter } from './adapters/local.adapter';

@Injectable()
export class StorageFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: DatabaseService,
  ) {}

  createStorageService(): IStorageService {
    const backend = this.configService.get<string>('STORAGE_BACKEND');

    switch (backend) {
      case 's3':
        return new S3Adapter(this.configService);

      case 'db':
        return new DatabaseAdapter(this.prisma);

      case 'local':
        return new LocalStorageAdapter(this.configService);

      default:
        throw new Error('Invalid storage backend');
    }
  }
}
