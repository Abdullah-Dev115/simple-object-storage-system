import { Test, TestingModule } from '@nestjs/testing';
import { BlobService } from './blob.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { IStorageService } from 'src/storage/storage.interface';
import { NotFoundException } from '@nestjs/common';
import { CreateBlobDto } from './dto/create-blob.dto';

describe('BlobService', () => {
  let service: BlobService;
  let mockStorageService: jest.Mocked<IStorageService>;
  let mockPrisma: any;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockStorageService = {
      store: jest.fn(),
      retrieve: jest.fn(),
    };

    mockPrisma = {
      blob: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlobService,
        {
          provide: 'STORAGE_SERVICE',
          useValue: mockStorageService,
        },
        {
          provide: DatabaseService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BlobService>(BlobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('storeBlob', () => {
    it('should store a blob successfully', async () => {
      const createBlobDto: CreateBlobDto = {
        id: 'test-blob-001',
        data: 'SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh',
      };

      const expectedBuffer = Buffer.from(createBlobDto.data, 'base64');
      const storageBackend = 's3';

      mockConfigService.get.mockReturnValue(storageBackend);
      mockPrisma.blob.create.mockResolvedValue({
        id: createBlobDto.id,
        size: expectedBuffer.length,
        storageBackend,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorageService.store.mockResolvedValue(undefined);

      await service.storeBlob(createBlobDto);

      expect(mockConfigService.get).toHaveBeenCalledWith('STORAGE_BACKEND');

      expect(mockPrisma.blob.create).toHaveBeenCalledWith({
        data: {
          id: createBlobDto.id,
          size: expectedBuffer.length,
          storageBackend,
        },
      });

      expect(mockStorageService.store).toHaveBeenCalledWith(
        createBlobDto.id,
        expectedBuffer,
      );
    });

    it('should rollback database entry if storage fails', async () => {
      const createBlobDto: CreateBlobDto = {
        id: 'test-blob-002',
        data: 'SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh',
      };

      mockConfigService.get.mockReturnValue('s3');
      mockPrisma.blob.create.mockResolvedValue({
        id: createBlobDto.id,
        size: 12,
        storageBackend: 's3',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const storageError = new Error('S3 connection failed');
      mockStorageService.store.mockRejectedValue(storageError);

      await expect(service.storeBlob(createBlobDto)).rejects.toThrow(
        'S3 connection failed',
      );

      expect(mockPrisma.blob.delete).toHaveBeenCalledWith({
        where: { id: createBlobDto.id },
      });
    });
  });

  describe('retrieveBlob', () => {
    it('should successfully retrieve a blob', async () => {
      const blobId = 'test-blob-001';
      const mockBlob = {
        id: blobId,
        size: 27,
        storageBackend: 's3',
        createdAt: new Date('2025-10-18T12:00:00Z'),
        updatedAt: new Date('2025-10-18T12:00:00Z'),
      };

      const mockBuffer = Buffer.from('Hello World!', 'utf-8');

      mockPrisma.blob.findUnique.mockResolvedValue(mockBlob);
      mockStorageService.retrieve.mockResolvedValue(mockBuffer);

      const result = await service.retrieveBlob(blobId);

      expect(mockPrisma.blob.findUnique).toHaveBeenCalledWith({
        where: { id: blobId },
      });

      expect(mockStorageService.retrieve).toHaveBeenCalledWith(blobId);

      expect(result).toEqual({
        id: blobId,
        data: mockBuffer.toString('base64'),
        size: 27,
        created_at: '2023-10-22T12:00:00.000Z',
      });
    });

    it('should throw notfound exception when blob doesnot exist', async () => {
      const blobId = 'non-existing-blob';

      mockPrisma.blob.findUnique.mockResolvedValue(null);

      await expect(service.retrieveBlob(blobId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.retrieveBlob(blobId)).rejects.toThrow(
        `Blob ${blobId} not found in database`,
      );

      expect(mockStorageService.retrieve).not.toHaveBeenCalled();
    });
  });
});
