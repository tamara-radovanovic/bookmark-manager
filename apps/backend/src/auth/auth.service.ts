import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { RefreshToken } from "./entities/refresh-token.entity";
import { RegisterDto } from "./dto/register.dto";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";

const BCRYPT_SALT_ROUNDS = 10;
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async issueRefreshToken(userId: string): Promise<string> {
    const secret = this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    const expiresIn = this.configService.getOrThrow<string>(
      "JWT_REFRESH_EXPIRES_IN",
    ) as JwtSignOptions["expiresIn"];

    const token = await this.jwtService.signAsync({ sub: userId }, { secret, expiresIn });
    const decoded = this.jwtService.decode<{ exp: number }>(token);

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const refreshToken = this.refreshTokensRepository.create({
      token_hash: tokenHash,
      user_id: userId,
      expires_at: new Date(decoded.exp * 1000),
    });
    await this.refreshTokensRepository.save(refreshToken);

    return token;
  }

  async register(dto: RegisterDto): Promise<{ access_token: string; refreshToken: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("AUTH_EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create(dto.email, hashedPassword);

    const access_token = await this.jwtService.signAsync({ sub: user.id });
    const refreshToken = await this.issueRefreshToken(user.id);

    return { access_token, refreshToken };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("AUTH_INVALID_CREDENTIALS");
    }

    const access_token = await this.jwtService.signAsync({ sub: user.id });
    const refreshToken = await this.issueRefreshToken(user.id);

    return { access_token, refreshToken };
  }
}
