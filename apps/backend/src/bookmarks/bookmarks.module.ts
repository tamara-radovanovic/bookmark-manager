import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Bookmark } from "./entities/bookmark.entity";
import { Tag } from "../tags/entities/tag.entity";
import { BookmarksController } from "./bookmarks.controller";
import { BookmarksService } from "./bookmarks.service";

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Tag])],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
