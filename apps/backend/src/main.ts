import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS (credentials: true, restricted to the frontend origin) is added in Phase 2
  // once the frontend actually sends authenticated requests with the refresh-token cookie.
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
