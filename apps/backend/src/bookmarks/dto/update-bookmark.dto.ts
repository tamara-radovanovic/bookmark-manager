import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";

// Every field optional, matching UpdateBookmarkInput = Partial<CreateBookmarkInput>
// in packages/shared. Written by hand rather than via @nestjs/mapped-types'
// PartialType — that package uses import.meta.url internally, which Jest's
// CommonJS runtime can't transform no matter what; not worth fighting for
// four fields.
export class UpdateBookmarkDto {
  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

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
