import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, Optional, forwardRef, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotifyService } from './notify.service';
import { UserNotifyService } from '../userNotify/usernotify.service';
import { UserEntity } from '../user/entity/user.entity';
import { WsRefreshGuard } from 'src/shared/guards/ws-refresh.guard';
import { WsTokenRefreshHelper } from 'src/shared/helpers/ws-token-refresh.helper';

interface ConnectedUser {
  userId: number;
  socketId: string;
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
  namespace: '/notifications',
})
export class NotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotifyGateway.name);
  
  private connectedUsers: Map<number, string> = new Map();
  
  private socketToUser: Map<string, number> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Optional() @Inject(forwardRef(() => NotifyService))
    private readonly notifyService?: NotifyService,
    @Optional() @Inject(forwardRef(() => UserNotifyService))
    private readonly userNotifyService?: UserNotifyService,
  ) {}

  afterInit(server: Server) {
    this.logger.log(' WebSocket Gateway Initialized');
    this.logger.log(` Listening on namespace: /notifications`);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(` Client attempting to connect: ${client.id}`);

      // Validar y refrescar token si es necesario
      const result = await WsTokenRefreshHelper.validateAndRefreshToken(
        client,
        this.jwtService,
        this.userRepository,
      );

      if (!result.valid || !result.userId) {
        this.logger.warn(`Socket ${client.id} authentication failed`);
        return; // El helper ya manejó el error y desconectó
      }

      const { userId, userName } = result;

      // Registrar el usuario conectado
      this.connectedUsers.set(userId, client.id);
      this.socketToUser.set(client.id, userId);

      this.logger.log(
        ` User ${userId} (${userName}) connected - Total users: ${this.connectedUsers.size}`,
      );

      // Notificar al cliente que está conectado
      client.emit('connected', {
        message: 'Conectado exitosamente al servidor de notificaciones',
        userId: userId,
        userName: userName,
        timestamp: new Date(),
        tokenRefreshed: result.tokenRefreshed || false,
      });

    } catch (error) {
      this.logger.error(` Error in handleConnection: ${error.message}`);
      client.emit('error', { message: 'Error al conectar' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.socketToUser.delete(client.id);
      
      this.logger.log(
        ` User ${userId} disconnected - Total users: ${this.connectedUsers.size}`,
      );
    } else {
      this.logger.log(`Unknown client disconnected: ${client.id}`);
    }
  }

  sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(` Notification sent to user ${userId}`);
      return true;
    } else {
      this.logger.warn(` User ${userId} is not connected`);
      return false;
    }
  }

  sendNotificationToUsers(userIds: number[], notification: any) {
    const results = {
      sent: 0,
      failed: 0,
      userIds: [] as number[],
    };

    userIds.forEach((userId) => {
      const success = this.sendNotificationToUser(userId, notification);
      if (success) {
        results.sent++;
        results.userIds.push(userId);
      } else {
        results.failed++;
      }
    });

    this.logger.log(
      ` Bulk notification - Sent: ${results.sent}, Failed: ${results.failed}`,
    );
    
    return results;
  }

  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log(
      ` Broadcast notification sent to ${this.connectedUsers.size} users`,
    );
  }

  getConnectedUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }
  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Evento para que el cliente marque una notificación como leída
   */
  @UseGuards(WsRefreshGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.socketToUser.get(client.id);
      
      if (!userId) {
        return { success: false, error: 'Usuario no identificado' };
      }

      if (!this.userNotifyService) {
        return { success: false, error: 'Servicio no disponible' };
      }

      this.logger.log(
        `📖 User ${userId} marking notification ${data.notificationId} as read`,
      );

      // Llamar al servicio para marcar como leída
      const result = await this.userNotifyService.markAsRead(userId, data.notificationId);

      return {
        success: true,
        notificationId: data.notificationId,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(` Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @UseGuards(WsRefreshGuard)
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(@ConnectedSocket() client: Socket) {
    try {
      const userId = this.socketToUser.get(client.id);
      
      if (!userId) {
        return { success: false, error: 'Usuario no identificado' };
      }

      this.logger.log(` User ${userId} requesting notifications`);

      return {
        success: true,
        message: 'Implementar lógica de obtención de notificaciones',
      };
    } catch (error) {
      this.logger.error(`Error getting notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @UseGuards(WsRefreshGuard)
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const userId = this.socketToUser.get(client.id);
    return {
      event: 'pong',
      data: {
        userId,
        timestamp: new Date(),
      },
    };
  }
}
