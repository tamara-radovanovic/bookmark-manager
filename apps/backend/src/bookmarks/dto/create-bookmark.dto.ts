import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateBookmarkDto {
  @IsUrl()
  url!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  favicon_url?: string;
}
