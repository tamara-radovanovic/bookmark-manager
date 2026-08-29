import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

// Only usable behind JwtAuthGuard — it's what populates request.user.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user!.sub;
});
