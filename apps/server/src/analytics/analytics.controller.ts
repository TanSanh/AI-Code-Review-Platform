import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard overview stats' })
  async getOverview(@CurrentUserId() userId: string) {
    return this.analyticsService.getOverview(userId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Score trends over time' })
  async getTrends(@CurrentUserId() userId: string) {
    return this.analyticsService.getTrends(userId);
  }

  @Get('languages')
  @ApiOperation({ summary: 'Language distribution' })
  async getLanguages(@CurrentUserId() userId: string) {
    return this.analyticsService.getLanguages(userId);
  }
}
