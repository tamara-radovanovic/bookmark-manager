import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { BookmarksService } from "./bookmarks.service";
import { Bookmark } from "./entities/bookmark.entity";
import { Tag } from "../tags/entities/tag.entity";

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: "bm-1",
    user_id: "user-1",
    url: "https://example.com",
    title: "Example",
    description: null,
    favicon_url: null,
    tags: [],
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as Bookmark;
}

describe("BookmarksService", () => {
  let service: BookmarksService;
  let repository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let tagsRepository: { findBy: jest.Mock };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => data),
      remove: jest.fn(),
    };

    tagsRepository = { findBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: getRepositoryToken(Bookmark), useValue: repository },
        { provide: getRepositoryToken(Tag), useValue: tagsRepository },
      ],
    }).compile();

    service = module.get(BookmarksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAllForUser", () => {
    it("always scopes to the requesting user", async () => {
      await service.findAllForUser("user-1");

      expect(queryBuilder.where).toHaveBeenCalledWith("bookmark.user_id = :userId", {
        userId: "user-1",
      });
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it("adds a title/url search condition when given", async () => {
      await service.findAllForUser("user-1", "react");

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        expect.objectContaining({ search: "%react%" }),
      );
    });

    it("adds a tag-name subquery condition when given, scoped to the user", async () => {
      await service.findAllForUser("user-1", undefined, ["react"]);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining("bookmark_tags"), {
        tagNames: ["react"],
        userId: "user-1",
        tagCount: 1,
      });
    });

    it("requires ALL given tags (AND), not just one of them", async () => {
      await service.findAllForUser("user-1", undefined, ["react", "tutorial"]);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining("HAVING"), {
        tagNames: ["react", "tutorial"],
        userId: "user-1",
        tagCount: 2,
      });
    });

    it("maps entities to the public DTO shape (no user_id, ISO date strings)", async () => {
      queryBuilder.getMany.mockResolvedValue([
        makeBookmark({ tags: [{ id: "tag-1", name: "react" } as Tag] }),
      ]);

      const [result] = await service.findAllForUser("user-1");

      expect(result).toEqual({
        id: "bm-1",
        url: "https://example.com",
        title: "Example",
        description: null,
        favicon_url: null,
        tags: [{ id: "tag-1", name: "react" }],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
      expect(result).not.toHaveProperty("user_id");
    });
  });

  describe("findOneForUser", () => {
    it("throws BOOKMARK_NOT_FOUND when no row matches id + user_id", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOneForUser("bm-1", "user-1")).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: "bm-1", user_id: "user-1" },
        relations: ["tags"],
      });
    });

    it("returns the bookmark's public shape when it belongs to the requesting user", async () => {
      repository.findOne.mockResolvedValue(makeBookmark());

      const result = await service.findOneForUser("bm-1", "user-1");

      expect(result.id).toBe("bm-1");
      expect(result).not.toHaveProperty("user_id");
    });
  });

  describe("create", () => {
    it("attaches user_id from the argument, not from the DTO, and never returns it", async () => {
      const dto = { url: "https://example.com", title: "Example" };
      repository.save.mockResolvedValue(makeBookmark());

      const result = await service.create("user-1", dto);

      expect(repository.create).toHaveBeenCalledWith({ ...dto, user_id: "user-1", tags: [] });
      expect(result).not.toHaveProperty("user_id");
    });

    it("rejects tag_ids that don't all belong to the user", async () => {
      tagsRepository.findBy.mockResolvedValue([{ id: "tag-1" }]); // only 1 of 2 resolved

      await expect(
        service.create("user-1", {
          url: "https://example.com",
          title: "Example",
          tag_ids: ["tag-1", "someone-elses-tag"],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("attaches only tags owned by the user", async () => {
      const ownedTags = [{ id: "tag-1", user_id: "user-1", name: "react" } as Tag];
      tagsRepository.findBy.mockResolvedValue(ownedTags);
      repository.save.mockResolvedValue(makeBookmark({ tags: ownedTags }));

      await service.create("user-1", {
        url: "https://example.com",
        title: "Example",
        tag_ids: ["tag-1"],
      });

      expect(tagsRepository.findBy).toHaveBeenCalledWith({
        id: expect.anything(),
        user_id: "user-1",
      });
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ tags: ownedTags }));
    });
  });

  describe("update", () => {
    it("throws BOOKMARK_NOT_FOUND before applying changes if not owned", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update("bm-1", "user-1", { title: "New" })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("merges only the given fields onto the existing bookmark", async () => {
      const existing = makeBookmark({ title: "Old title", url: "https://example.com" });
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockImplementation((data) => data);

      const result = await service.update("bm-1", "user-1", { title: "New title" });

      expect(result.title).toBe("New title");
      expect(result.url).toBe("https://example.com");
      expect(tagsRepository.findBy).not.toHaveBeenCalled();
    });

    it("replaces tags only when tag_ids is explicitly provided", async () => {
      const existing = makeBookmark({ tags: [{ id: "old-tag", name: "old" } as Tag] });
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockImplementation((data) => data);
      const newTags = [{ id: "new-tag", user_id: "user-1", name: "new" } as Tag];
      tagsRepository.findBy.mockResolvedValue(newTags);

      const result = await service.update("bm-1", "user-1", { tag_ids: ["new-tag"] });

      expect(result.tags).toEqual([{ id: "new-tag", name: "new" }]);
    });
  });

  describe("remove", () => {
    it("throws BOOKMARK_NOT_FOUND before attempting removal if not owned", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove("bm-1", "user-1")).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it("removes the bookmark when owned by the requesting user", async () => {
      const bookmark = makeBookmark();
      repository.findOne.mockResolvedValue(bookmark);

      await service.remove("bm-1", "user-1");

      expect(repository.remove).toHaveBeenCalledWith(bookmark);
    });
  });
});
