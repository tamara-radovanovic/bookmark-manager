import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";

/**
 * Reshapes NestJS's default error body ({ statusCode, message, error }) into
 * { error_code } wherever `message` is one of our own single-string codes
 * (e.g. "AUTH_INVALID_CREDENTIALS"), matching the contract in README.md.
 * class-validator failures carry an array of human-readable messages instead
 * of a single code, so those pass through unchanged.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const message = typeof body === "string" ? body : (body as { message?: unknown }).message;

    if (typeof message === "string") {
      response.status(status).json({ error_code: message });
      return;
    }

    response.status(status).json(body);
  }
}
