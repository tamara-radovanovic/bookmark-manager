import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { RefreshToken } from "./entities/refresh-token.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken]), UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
