import { Body, Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { access_token, refreshToken } = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return { access_token };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { access_token, refreshToken } = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return { access_token };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    });
  }
}
