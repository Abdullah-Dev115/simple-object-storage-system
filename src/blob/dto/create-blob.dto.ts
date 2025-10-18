import { IsBase64, IsNotEmpty, IsString } from 'class-validator';

export class CreateBlobDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  data: string;
}
