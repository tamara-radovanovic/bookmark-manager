import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.getOrThrow<string>("DATABASE_URL"),
        // No entities yet — they arrive with the users/bookmarks/tags modules in
        // later phases. autoLoadEntities means we won't need to touch this file again.
        autoLoadEntities: true,
        // Schema changes go through migrations, never automatic sync — even in dev,
        // so what's in the DB always matches a reviewable migration file.
        synchronize: false,
      }),
    }),
    HealthModule,
  ],
})
export class AppModule {}
