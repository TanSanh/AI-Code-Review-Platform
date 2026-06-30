import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentGateway } from './comment.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CommentController],
  providers: [CommentService, CommentGateway],
  exports: [CommentService, CommentGateway],
})
export class CommentModule {}
