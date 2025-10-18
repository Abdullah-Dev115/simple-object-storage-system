import { DatabaseService } from 'src/database/database.service';
import { IStorageService } from '../storage.interface';
import { NotFoundException } from '@nestjs/common';

export class DatabaseAdapter implements IStorageService {
  constructor(private readonly prisma: DatabaseService) {}

  async store(id: string, data: Buffer): Promise<void> {
    await this.prisma.blobStorage.create({
      data: {
        id,
        data,
      },
    });
  }

  async retrieve(id: string): Promise<Buffer> {
    const blobStorage = await this.prisma.blobStorage.findUnique({
      where: {
        id,
      },
    });

    if (!blobStorage) {
      throw new NotFoundException(`Blob ${id} not found in database`);
    }

    return Buffer.from(blobStorage.data);
  }
}
