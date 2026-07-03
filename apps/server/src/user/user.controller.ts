import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }

  @Public()
  @Get(':id/posts')
  @ApiOperation({ summary: 'Get user posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.getUserPosts(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
