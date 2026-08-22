import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  try {
    console.log("Starting server initialization...");
    console.log("NODE_ENV:", process.env.NODE_ENV || "not set");
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL ? "***SET***" : "❌ NOT SET",
    );
    console.log(
      "JWT_SECRET:",
      process.env.JWT_SECRET ? "***SET***" : "❌ NOT SET",
    );
    console.log("PORT:", process.env.PORT || "not set (default: 3001)");

    const app = await NestFactory.create(AppModule);
    console.log("✅ AppModule initialized");

    // ─── Body Parser: increase limit for base64 images ──
    app.use(json({ limit: "10mb" }));
    app.use(urlencoded({ limit: "10mb", extended: true }));

    const configService = app.get(ConfigService);

    // ─── Security ──────────────────────────────────
    app.use(helmet());

    const corsOrigin = configService.get<string>(
      "CORS_ORIGIN",
      "http://localhost:3000",
    );
    app.enableCors({
      origin:
        corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim()),
      credentials: corsOrigin !== "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    });

    // ─── Global Prefix ─────────────────────────────
    const apiPrefix = configService.get<string>("API_PREFIX", "api/v1");
    app.setGlobalPrefix(apiPrefix);

    // ─── Validation ────────────────────────────────
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // ─── Global Interceptors & Filters ─────────────
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    // ─── Swagger ───────────────────────────────────
    const config = new DocumentBuilder()
      .setTitle("AI Code Review API")
      .setDescription("AI-Powered Code Review + Collaboration Platform API")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("auth", "Authentication endpoints")
      .addTag("reviews", "Code review management")
      .addTag("issues", "Review issues")
      .addTag("comments", "Discussion comments")
      .addTag("analytics", "Dashboard analytics")
      .addTag("community", "Community posts and discussions")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

    // ─── Start Server ──────────────────────────────
    const port = configService.get<number>("PORT", 3001);
    await app.listen(port, "0.0.0.0");

    console.log(`🚀 Server running on: http://0.0.0.0:${port}`);
  } catch (error) {
    console.error("Server failed to start:", error);
    console.error(
      "Stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    process.exit(1);
  }
}
bootstrap();
