import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { BookmarksService } from "./bookmarks.service";
import { CreateBookmarkDto } from "./dto/create-bookmark.dto";
import { UpdateBookmarkDto } from "./dto/update-bookmark.dto";

@Controller("bookmarks")
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(
    @CurrentUser() userId: string,
    @Query("search") search?: string,
    @Query("tags") tags?: string | string[],
  ) {
    // Express/qs gives a plain string for a single repeated query key
    // ("?tags=a") and an array once it repeats ("?tags=a&tags=b") — always
    // normalize to an array so the service only has one shape to handle.
    const tagList = tags === undefined ? undefined : ([] as string[]).concat(tags);
    return this.bookmarksService.findAllForUser(userId, search, tagList);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() userId: string) {
    return this.bookmarksService.findOneForUser(id, userId);
  }

  @Post()
  create(@Body() dto: CreateBookmarkDto, @CurrentUser() userId: string) {
    return this.bookmarksService.create(userId, dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBookmarkDto, @CurrentUser() userId: string) {
    return this.bookmarksService.update(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @CurrentUser() userId: string): Promise<void> {
    await this.bookmarksService.remove(id, userId);
  }
}
