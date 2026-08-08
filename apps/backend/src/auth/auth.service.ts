import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import type { User as UserDto } from "@bookmark-manager/shared";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { RefreshToken } from "./entities/refresh-token.entity";
import { RegisterDto } from "./dto/register.dto";

const BCRYPT_SALT_ROUNDS = 10;
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<UserDto> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
        throw new ConflictException("AUTH_EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create(dto.email, hashedPassword);

    return { id: user.id, email: user.email, created_at: user.created_at.toISOString() };
  }
}
