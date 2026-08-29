import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { TagsService } from "./tags.service";
import { Tag } from "./entities/tag.entity";

describe("TagsService", () => {
  let service: TagsService;
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
      providers: [TagsService, { provide: getRepositoryToken(Tag), useValue: repository }],
    }).compile();

    service = module.get(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAllForUser", () => {
    it("queries by user_id, ordered by name", async () => {
      repository.find.mockResolvedValue([]);

      await service.findAllForUser("user-1");

      expect(repository.find).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
        order: { name: "ASC" },
      });
    });
  });

  describe("create", () => {
    it("rejects a duplicate name for the same user", async () => {
      repository.findOneBy.mockResolvedValue({ id: "existing", name: "react" });

      await expect(service.create("user-1", { name: "react" })).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("creates the tag scoped to the user when the name is free", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await service.create("user-1", { name: "react" });

      expect(repository.create).toHaveBeenCalledWith({ name: "react", user_id: "user-1" });
    });
  });

  describe("remove", () => {
    it("throws TAG_NOT_FOUND when the tag isn't owned by the requesting user", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove("tag-1", "user-1")).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it("removes the tag when owned by the requesting user", async () => {
      const tag = { id: "tag-1", user_id: "user-1", name: "react" };
      repository.findOneBy.mockResolvedValue(tag);

      await service.remove("tag-1", "user-1");

      expect(repository.remove).toHaveBeenCalledWith(tag);
    });
  });
});
