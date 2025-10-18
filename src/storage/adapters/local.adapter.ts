import { NotFoundException } from '@nestjs/common';
import { IStorageService } from '../storage.interface';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

export class LocalStorageAdapter implements IStorageService {
  private readonly storagePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>('LOCAL_STORAGE_PATH');
    this.ensureStorageDirectory();
  }

  async store(id: string, data: Buffer): Promise<void> {
    const filePath = path.join(this.storagePath, id);

    try {
      await fs.writeFile(filePath, data);
    } catch (error) {
      throw new Error(`FAiled to store blob ${id}`);
    }
  }

  async retrieve(id: string): Promise<Buffer> {
    const filePath = path.join(this.storagePath, id);

    try {
      await fs.access(filePath);

      const data = await fs.readFile(filePath);
      return data;
    } catch (error) {
      // file does not exisst
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`Blob ${id} not found in local storage`);
      }
      throw new Error(`Failed to retrieve blob ${id}`);
    }
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.access(this.storagePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.storagePath, { recursive: true });
      }
    }
  }
}
