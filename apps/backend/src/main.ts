import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(cookieParser());
  // CORS (credentials: true, restricted to the frontend origin) is added in Phase 2
  // once the frontend actually sends authenticated requests with the refresh-token cookie.
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
