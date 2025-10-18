import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import type { IStorageService } from 'src/storage/storage.interface';
import { CreateBlobDto } from './dto/create-blob.dto';
import { BlobResponseDto } from './dto/blob-response.dto';

@Injectable()
export class BlobService {
  constructor(
    @Inject('STORAGE_SERVICE')
    private readonly storageService: IStorageService,
    private readonly prisma: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async storeBlob(createBlobDto: CreateBlobDto): Promise<void> {
    const { id, data } = createBlobDto;

    const buffer = Buffer.from(data, 'base64');

    const storageBackend = this.configService.get<string>('STORAGE_BACKEND');

    await this.prisma.blob.create({
      data: {
        id,
        size: buffer.length,
        storageBackend,
      },
    });

    try {
      await this.storageService.store(id, buffer);
    } catch (error) {
      // for database only
      await this.prisma.blob.delete({ where: { id } });
      throw error;
    }
  }

  async retrieveBlob(id: string): Promise<BlobResponseDto> {
    const blob = await this.prisma.blob.findUnique({
      where: { id },
    });

    if (!blob) {
      throw new NotFoundException(`Blob ${id} not found in database`);
    }

    const buffer = await this.storageService.retrieve(id);
    const base64Data = buffer.toString('base64');

    return {
      id: blob.id,
      data: base64Data,
      size: blob.size,
      created_at: blob.createdAt.toISOString(),
    };
  }
}
