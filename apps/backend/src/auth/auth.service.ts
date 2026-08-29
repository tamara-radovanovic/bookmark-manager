import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { RefreshToken } from "./entities/refresh-token.entity";
import { RegisterDto } from "./dto/register.dto";
import { JwtService } from "@nestjs/jwt";
import { AuthTokenResponse } from "@bookmark-manager/shared";
import { UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";

const BCRYPT_SALT_ROUNDS = 10;
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("AUTH_EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create(dto.email, hashedPassword);

    const access_token = await this.jwtService.signAsync({ sub: user.id });

    return { access_token };
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("AUTH_INVALID_CREDENTIALS");
    }

    const access_token = await this.jwtService.signAsync({ sub: user.id });

    return { access_token };
  }
}
