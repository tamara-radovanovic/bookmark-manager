import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { RefreshToken } from "./entities/refresh-token.entity";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock };
  let jwtService: { signAsync: jest.Mock; decode: jest.Mock; verifyAsync: jest.Mock };
  let refreshTokensRepository: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    findOneBy: jest.Mock;
  };

  const CONFIG_VALUES: Record<string, string> = {
    JWT_REFRESH_SECRET: "test-refresh-secret",
    JWT_REFRESH_EXPIRES_IN: "7d",
  };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), create: jest.fn() };
    jwtService = { signAsync: jest.fn(), decode: jest.fn(), verifyAsync: jest.fn() };
    refreshTokensRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      delete: jest.fn(),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokensRepository },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn((key: string) => CONFIG_VALUES[key]) },
        },
      ],
    }).compile();

    service = module.get(AuthService);

    jwtService.signAsync.mockResolvedValue("signed-access-token");
    jwtService.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 604800 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("rejects a duplicate email without touching bcrypt or the users table", async () => {
      usersService.findByEmail.mockResolvedValue({ id: "existing-id" });

      await expect(
        service.register({ email: "taken@example.com", password: "password123" }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it("hashes the password, creates the user, and returns a token pair", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: "new-id", email: "new@example.com" });

      const result = await service.register({ email: "new@example.com", password: "password123" });

      expect(usersService.create).toHaveBeenCalledWith("new@example.com", expect.any(String));
      const hashedPasswordArg = usersService.create.mock.calls[0][1] as string;
      expect(hashedPasswordArg).not.toBe("password123");
      expect(await bcrypt.compare("password123", hashedPasswordArg)).toBe(true);
      expect(result.access_token).toBe("signed-access-token");
      expect(refreshTokensRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("login", () => {
    it("rejects an email that doesn't exist", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "ghost@example.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a wrong password with the same error as a nonexistent email", async () => {
      const hashed = await bcrypt.hash("correct-password", 10);
      usersService.findByEmail.mockResolvedValue({ id: "user-id", password: hashed });

      await expect(
        service.login({ email: "user@example.com", password: "wrong-password" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns a token pair when the credentials are correct", async () => {
      const hashed = await bcrypt.hash("correct-password", 10);
      usersService.findByEmail.mockResolvedValue({ id: "user-id", password: hashed });

      const result = await service.login({
        email: "user@example.com",
        password: "correct-password",
      });

      expect(result.access_token).toBe("signed-access-token");
    });
  });

  describe("refresh", () => {
    it("rejects a missing token", async () => {
      await expect(service.refresh(undefined)).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a token that fails signature/expiry verification", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("jwt expired"));

      await expect(service.refresh("expired-or-tampered-token")).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokensRepository.findOneBy).not.toHaveBeenCalled();
    });

    it("rejects a validly-signed token with no matching row (revoked/reused)", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "user-id" });
      refreshTokensRepository.findOneBy.mockResolvedValue(null);

      await expect(service.refresh("valid-but-revoked-token")).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokensRepository.delete).not.toHaveBeenCalled();
    });

    it("rotates the token on success: deletes the old row and issues a new pair", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "user-id" });
      refreshTokensRepository.findOneBy.mockResolvedValue({ id: "old-row-id", user_id: "user-id" });

      const result = await service.refresh("valid-refresh-token");

      expect(refreshTokensRepository.delete).toHaveBeenCalledWith("old-row-id");
      expect(result.access_token).toBe("signed-access-token");
      expect(refreshTokensRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("logout", () => {
    it("does nothing when no token is provided", async () => {
      await service.logout(undefined);
      expect(refreshTokensRepository.delete).not.toHaveBeenCalled();
    });

    it("deletes the row matching the token's hash", async () => {
      await service.logout("some-refresh-token");
      expect(refreshTokensRepository.delete).toHaveBeenCalledWith({
        token_hash: expect.any(String),
      });
    });
  });
});
