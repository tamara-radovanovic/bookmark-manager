import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { Tag as TagDto } from "@bookmark-manager/shared";
import { Tag } from "./entities/tag.entity";
import { CreateTagDto } from "./dto/create-tag.dto";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findAllForUser(userId: string): Promise<TagDto[]> {
    const tags = await this.tagsRepository.find({
      where: { user_id: userId },
      order: { name: "ASC" },
    });
    return tags.map((tag) => this.toDto(tag));
  }

  async create(userId: string, dto: CreateTagDto): Promise<TagDto> {
    const existing = await this.tagsRepository.findOneBy({ user_id: userId, name: dto.name });
    if (existing) {
      throw new ConflictException("TAG_ALREADY_EXISTS");
    }

    const tag = this.tagsRepository.create({ name: dto.name, user_id: userId });
    return this.toDto(await this.tagsRepository.save(tag));
  }

  async remove(id: string, userId: string): Promise<void> {
    // Deleting a tag doesn't touch the bookmarks it's attached to — the
    // bookmark_tags FK is ON DELETE CASCADE, so the association rows are
    // dropped automatically; the bookmarks themselves are untouched.
    const tag = await this.tagsRepository.findOneBy({ id, user_id: userId });
    if (!tag) {
      throw new NotFoundException("TAG_NOT_FOUND");
    }
    await this.tagsRepository.remove(tag);
  }

  // Never return the entity directly — it carries user_id, which isn't part
  // of the public Tag contract in packages/shared.
  private toDto(tag: Tag): TagDto {
    return { id: tag.id, name: tag.name };
  }
}
