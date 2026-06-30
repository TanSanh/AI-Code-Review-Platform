import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class CommentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommentGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.userId = payload.sub;
      client.userEmail = payload.email;

      this.logger.log(`Client connected: ${client.id} (user: ${payload.email})`);
    } catch {
      this.logger.warn(`Client ${client.id} authentication failed`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:review')
  handleJoinReview(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { reviewId: string },
  ) {
    client.join(`review:${data.reviewId}`);
    this.logger.log(`Client ${client.id} joined review room: ${data.reviewId}`);
  }

  @SubscribeMessage('leave:review')
  handleLeaveReview(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { reviewId: string },
  ) {
    client.leave(`review:${data.reviewId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { reviewId: string },
  ) {
    client.to(`review:${data.reviewId}`).emit('user:typing', {
      userId: client.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { reviewId: string },
  ) {
    client.to(`review:${data.reviewId}`).emit('user:typing', {
      userId: client.userId,
      isTyping: false,
    });
  }

  broadcastComment(reviewId: string, comment: unknown) {
    this.server.to(`review:${reviewId}`).emit('comment:created', comment);
  }

  broadcastReviewCompleted(reviewId: string, review: unknown) {
    this.server.to(`review:${reviewId}`).emit('review:completed', review);
  }

  broadcastIssueUpdated(reviewId: string, issue: unknown) {
    this.server.to(`review:${reviewId}`).emit('issue:updated', issue);
  }
}
