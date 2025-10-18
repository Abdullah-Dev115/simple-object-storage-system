import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { BlobService } from './blob.service';
import { CreateBlobDto } from './dto/create-blob.dto';
import { BlobResponseDto } from './dto/blob-response.dto';

@Controller('blob')
@UseGuards(AuthGuard)
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

  @Post()
  async createBlob(
    @Body() createblobDto: CreateBlobDto,
  ): Promise<{ message: string }> {
    await this.blobService.storeBlob(createblobDto);
    return { message: `Blob  ${createblobDto.id} is created` };
  }

  @Get(':id')
  async retrieveBlob(@Param('id') id: string): Promise<BlobResponseDto> {
    return this.blobService.retrieveBlob(id);
  }
}
