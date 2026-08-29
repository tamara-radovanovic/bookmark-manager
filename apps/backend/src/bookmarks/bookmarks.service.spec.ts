import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { BookmarksService } from "./bookmarks.service";
import { Bookmark } from "./entities/bookmark.entity";

describe("BookmarksService", () => {
  let service: BookmarksService;
  let repository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => data),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: getRepositoryToken(Bookmark), useValue: repository },
      ],
    }).compile();

    service = module.get(BookmarksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAllForUser", () => {
    it("queries by user_id only when there's no search term", async () => {
      repository.find.mockResolvedValue([]);

      await service.findAllForUser("user-1");

      expect(repository.find).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
        order: { created_at: "DESC" },
      });
    });

    it("matches title OR url when a search term is given, still scoped to the user", async () => {
      repository.find.mockResolvedValue([]);

      await service.findAllForUser("user-1", "react");

      const [options] = repository.find.mock.calls[0];
      expect(options.where).toEqual([
        { user_id: "user-1", title: expect.anything() },
        { user_id: "user-1", url: expect.anything() },
      ]);
    });
  });

  describe("findOneForUser", () => {
    it("throws BOOKMARK_NOT_FOUND when no row matches id + user_id", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneForUser("bm-1", "user-1")).rejects.toThrow(NotFoundException);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: "bm-1", user_id: "user-1" });
    });

    it("throws the same BOOKMARK_NOT_FOUND for a bookmark owned by someone else", async () => {
      // The repository call itself is scoped by user_id, so a bookmark that
      // exists but belongs to another user simply never matches — same code
      // path as "doesn't exist at all". That's what keeps this a 404, not 403.
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneForUser("someone-elses-bookmark", "user-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns the bookmark when it belongs to the requesting user", async () => {
      const bookmark = { id: "bm-1", user_id: "user-1", title: "Example" };
      repository.findOneBy.mockResolvedValue(bookmark);

      await expect(service.findOneForUser("bm-1", "user-1")).resolves.toBe(bookmark);
    });
  });

  describe("create", () => {
    it("attaches user_id from the argument, not from the DTO", async () => {
      const dto = { url: "https://example.com", title: "Example" };

      await service.create("user-1", dto);

      expect(repository.create).toHaveBeenCalledWith({ ...dto, user_id: "user-1" });
    });
  });

  describe("update", () => {
    it("throws BOOKMARK_NOT_FOUND before applying changes if not owned", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update("bm-1", "user-1", { title: "New" })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("merges only the given fields onto the existing bookmark", async () => {
      const existing = {
        id: "bm-1",
        user_id: "user-1",
        title: "Old title",
        url: "https://example.com",
      };
      repository.findOneBy.mockResolvedValue(existing);

      const result = await service.update("bm-1", "user-1", { title: "New title" });

      expect(result).toEqual({ ...existing, title: "New title" });
    });
  });

  describe("remove", () => {
    it("throws BOOKMARK_NOT_FOUND before attempting removal if not owned", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove("bm-1", "user-1")).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it("removes the bookmark when owned by the requesting user", async () => {
      const bookmark = { id: "bm-1", user_id: "user-1" };
      repository.findOneBy.mockResolvedValue(bookmark);

      await service.remove("bm-1", "user-1");

      expect(repository.remove).toHaveBeenCalledWith(bookmark);
    });
  });
});
