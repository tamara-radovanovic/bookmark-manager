import { BadRequestException, type ValidationError } from "@nestjs/common";

// { error_code, fields } for every validation failure — the shape README.md
// documents for bookmarks, applied API-wide so every endpoint fails the same way.
export function buildValidationExceptionFactory() {
  return (errors: ValidationError[]) => {
    const fields = errors.map((error) => error.property);
    return new BadRequestException({ error_code: "VALIDATION_FAILED", fields });
  };
}
