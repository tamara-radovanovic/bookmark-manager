import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Bookmark } from "./entities/bookmark.entity";
import { CreateBookmarkDto } from "./dto/create-bookmark.dto";
import { UpdateBookmarkDto } from "./dto/update-bookmark.dto";

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarksRepository: Repository<Bookmark>,
  ) {}

  findAllForUser(userId: string, search?: string): Promise<Bookmark[]> {
    if (search) {
      return this.bookmarksRepository.find({
        where: [
          { user_id: userId, title: ILike(`%${search}%`) },
          { user_id: userId, url: ILike(`%${search}%`) },
        ],
        order: { created_at: "DESC" },
      });
    }

    return this.bookmarksRepository.find({
      where: { user_id: userId },
      order: { created_at: "DESC" },
    });
  }

  async findOneForUser(id: string, userId: string): Promise<Bookmark> {
    // Scoping the WHERE to user_id (not just id) is what makes another
    // user's bookmark come back as "not found" rather than "forbidden" —
    // we never confirm the row exists at all for someone who doesn't own it.
    const bookmark = await this.bookmarksRepository.findOneBy({ id, user_id: userId });
    if (!bookmark) {
      throw new NotFoundException("BOOKMARK_NOT_FOUND");
    }
    return bookmark;
  }

  create(userId: string, dto: CreateBookmarkDto): Promise<Bookmark> {
    const bookmark = this.bookmarksRepository.create({ ...dto, user_id: userId });
    return this.bookmarksRepository.save(bookmark);
  }

  async update(id: string, userId: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
    const bookmark = await this.findOneForUser(id, userId);

    // dto's untouched optional fields are still own properties set to
    // `undefined` (useDefineForClassFields, per our ES2023 target) — a plain
    // Object.assign would overwrite existing values with undefined for any
    // field the client didn't send. Only fields actually present get applied.
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        Reflect.set(bookmark, key, value);
      }
    }

    return this.bookmarksRepository.save(bookmark);
  }

  async remove(id: string, userId: string): Promise<void> {
    const bookmark = await this.findOneForUser(id, userId);
    await this.bookmarksRepository.remove(bookmark);
  }
}
