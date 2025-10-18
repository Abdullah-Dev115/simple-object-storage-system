import { Test, TestingModule } from '@nestjs/testing';
import { BlobController } from './blob.controller';
import { BlobService } from './blob.service';
import { CreateBlobDto } from './dto/create-blob.dto';
import { BlobResponseDto } from './dto/blob-response.dto';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';

describe('BlobController', () => {
  let controller: BlobController;
  let service: BlobService;

  beforeEach(async () => {
    const mockBlobService = {
      storeBlob: jest.fn(),
      retrieveBlob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlobController],
      providers: [
        {
          provide: BlobService,
          useValue: mockBlobService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<BlobController>(BlobController);
    service = module.get<BlobService>(BlobService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBlob', () => {
    it('should create blob and return success ', async () => {
      const createBlobDto: CreateBlobDto = {
        id: 'test-blob-001',
        data: 'SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh',
      };

      jest.spyOn(service, 'storeBlob').mockResolvedValue(undefined);

      const result = await controller.createBlob(createBlobDto);

      expect(service.storeBlob).toHaveBeenCalledWith(createBlobDto);
      expect(service.storeBlob).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        message: `Blob  ${createBlobDto.id} is created`,
      });
    });

    it('should send errors to the client from service', async () => {
      const createBlobDto: CreateBlobDto = {
        id: 'test-blob-002',
        data: 'SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh',
      };

      const serviceError = new Error('Blob storing failed');
      jest.spyOn(service, 'storeBlob').mockRejectedValue(serviceError);

      await expect(controller.createBlob(createBlobDto)).rejects.toThrow(
        'Blob storing failed',
      );
    });
  });

  describe('retrieveBlob', () => {
    it('should retrieve a blob by id', async () => {
      const blobId = 'test-blob-001';
      const mockBlobResponse: BlobResponseDto = {
        id: blobId,
        data: 'SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh',
        size: 27,
        created_at: '2023-10-22T12:00:00.000Z',
      };

      jest.spyOn(service, 'retrieveBlob').mockResolvedValue(mockBlobResponse);

      const result = await controller.retrieveBlob(blobId);

      expect(service.retrieveBlob).toHaveBeenCalledWith(blobId);
      expect(service.retrieveBlob).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockBlobResponse);
    });

    it('should throw not found exception when blob does not exist', async () => {
      const blobId = 'non-existing-blob';

      jest
        .spyOn(service, 'retrieveBlob')
        .mockRejectedValue(
          new NotFoundException(`Blob ${blobId} not found in database`),
        );

      await expect(controller.retrieveBlob(blobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle different blob ids correctly', async () => {
      const testCases = ['blob-1', 'my-document', 'user-avatar-123'];

      for (const blobId of testCases) {
        const mockResponse: BlobResponseDto = {
          id: blobId,
          data: 'test-data',
          size: 100,
          created_at: new Date().toISOString(),
        };

        jest.spyOn(service, 'retrieveBlob').mockResolvedValue(mockResponse);

        const result = await controller.retrieveBlob(blobId);

        expect(service.retrieveBlob).toHaveBeenCalledWith(blobId);
        expect(result.id).toBe(blobId);
      }
    });
  });
});
