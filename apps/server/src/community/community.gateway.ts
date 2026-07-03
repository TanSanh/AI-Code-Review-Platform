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
export class CommunityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommunityGateway.name);

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
        this.logger.warn(`Community client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.userId = payload.sub;
      client.userEmail = payload.email;

      this.logger.log(`Community client connected: ${client.id} (user: ${payload.email})`);
    } catch {
      this.logger.warn(`Community client ${client.id} authentication failed`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Community client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:community')
  handleJoinPost(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { postId: string },
  ) {
    client.join(`community:${data.postId}`);
    this.logger.log(`Client ${client.id} joined community post: ${data.postId}`);
  }

  @SubscribeMessage('leave:community')
  handleLeavePost(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { postId: string },
  ) {
    client.leave(`community:${data.postId}`);
  }

  broadcastComment(postId: string, comment: unknown) {
    this.server.to(`community:${postId}`).emit('community:comment:created', comment);
  }

  broadcastCommentDeleted(postId: string, commentId: string) {
    this.server.to(`community:${postId}`).emit('community:comment:deleted', { postId, commentId });
  }
}
