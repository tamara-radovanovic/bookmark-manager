import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type { Bookmark as BookmarkDto } from "@bookmark-manager/shared";
import { Bookmark } from "./entities/bookmark.entity";
import { Tag } from "../tags/entities/tag.entity";
import { CreateBookmarkDto } from "./dto/create-bookmark.dto";
import { UpdateBookmarkDto } from "./dto/update-bookmark.dto";

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarksRepository: Repository<Bookmark>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findAllForUser(userId: string, search?: string, tags?: string[]): Promise<BookmarkDto[]> {
    const query = this.bookmarksRepository
      .createQueryBuilder("bookmark")
      .leftJoinAndSelect("bookmark.tags", "tag")
      .where("bookmark.user_id = :userId", { userId })
      .orderBy("bookmark.created_at", "DESC");

    if (search) {
      query.andWhere("(bookmark.title ILIKE :search OR bookmark.url ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    if (tags && tags.length > 0) {
      // A subquery, not a condition on the "tag" join alias above — filtering
      // that alias directly would also throw away every OTHER tag on a
      // matching bookmark, since TypeORM hydrates the "tags" relation only
      // from the joined rows that survive the WHERE.
      //
      // AND semantics: a bookmark only matches if it has EVERY requested tag,
      // not just one of them — GROUP BY + HAVING COUNT(...) = tagCount is
      // what enforces "all of these", not "any of these".
      query.andWhere(
        `bookmark.id IN (
          SELECT bt.bookmark_id FROM bookmark_tags bt
          INNER JOIN tags t ON t.id = bt.tag_id
          WHERE t.name IN (:...tagNames) AND t.user_id = :userId
          GROUP BY bt.bookmark_id
          HAVING COUNT(DISTINCT t.name) = :tagCount
        )`,
        { tagNames: tags, userId, tagCount: tags.length },
      );
    }

    const bookmarks = await query.getMany();
    return bookmarks.map((bookmark) => this.toDto(bookmark));
  }

  async findOneForUser(id: string, userId: string): Promise<BookmarkDto> {
    return this.toDto(await this.getOwnedBookmark(id, userId));
  }

  async create(userId: string, dto: CreateBookmarkDto): Promise<BookmarkDto> {
    const { tag_ids, ...rest } = dto;
    const tags = await this.resolveTagsForUser(userId, tag_ids);

    const bookmark = this.bookmarksRepository.create({ ...rest, user_id: userId, tags });
    return this.toDto(await this.bookmarksRepository.save(bookmark));
  }

  async update(id: string, userId: string, dto: UpdateBookmarkDto): Promise<BookmarkDto> {
    const bookmark = await this.getOwnedBookmark(id, userId);
    const { tag_ids, ...rest } = dto;

    // dto's untouched optional fields are still own properties set to
    // `undefined` (useDefineForClassFields, per our ES2023 target) — a plain
    // Object.assign would overwrite existing values with undefined for any
    // field the client didn't send. Only fields actually present get applied.
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        Reflect.set(bookmark, key, value);
      }
    }

    if (tag_ids !== undefined) {
      bookmark.tags = await this.resolveTagsForUser(userId, tag_ids);
    }

    return this.toDto(await this.bookmarksRepository.save(bookmark));
  }

  async remove(id: string, userId: string): Promise<void> {
    const bookmark = await this.getOwnedBookmark(id, userId);
    await this.bookmarksRepository.remove(bookmark);
  }

  // Scoping the WHERE to user_id (not just id) is what makes another user's
  // bookmark come back as "not found" rather than "forbidden" — we never
  // confirm the row exists at all for someone who doesn't own it.
  private async getOwnedBookmark(id: string, userId: string): Promise<Bookmark> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: { id, user_id: userId },
      relations: ["tags"],
    });
    if (!bookmark) {
      throw new NotFoundException("BOOKMARK_NOT_FOUND");
    }
    return bookmark;
  }

  // Every tag_id must both exist and belong to the requesting user — without
  // this check, a user could attach (or discover the existence of) another
  // user's tag just by guessing its UUID.
  private async resolveTagsForUser(userId: string, tagIds: string[] | undefined): Promise<Tag[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    const tags = await this.tagsRepository.findBy({ id: In(tagIds), user_id: userId });
    if (tags.length !== tagIds.length) {
      throw new BadRequestException("INVALID_TAG_IDS");
    }

    return tags;
  }

  // Never return the entity directly — it carries user_id (an internal FK,
  // not part of the public contract) and Date objects where the shared
  // Bookmark type promises ISO strings.
  private toDto(bookmark: Bookmark): BookmarkDto {
    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      favicon_url: bookmark.favicon_url,
      tags: bookmark.tags.map((tag) => ({ id: tag.id, name: tag.name })),
      created_at: bookmark.created_at.toISOString(),
      updated_at: bookmark.updated_at.toISOString(),
    };
  }
}
