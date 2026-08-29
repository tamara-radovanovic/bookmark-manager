import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";

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

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  tag_ids?: string[];
}
