import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import configuration from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ReviewModule } from './review/review.module';
import { IssueModule } from './issue/issue.module';
import { AiReviewModule } from './ai-review/ai-review.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CommunityModule } from './community/community.module';
import { NotificationModule } from './notification/notification.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [],
      useFactory: () => ({
        throttlers: [{ ttl: 900000, limit: 100 }],
      }),
    }),

    PrismaModule,
    AuthModule,
    ReviewModule,
    IssueModule,
    AiReviewModule,
    AnalyticsModule,
    CommunityModule,
    NotificationModule,
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
