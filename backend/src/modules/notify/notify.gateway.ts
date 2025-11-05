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
import { Logger, Inject, Optional, forwardRef } from '@nestjs/common';
import { NotifyService } from './notify.service';

interface ConnectedUser {
  userId: number;
  socketId: string;
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*', 
    credentials: true,
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
    @Optional() @Inject(forwardRef(() => NotifyService))
    private readonly notifyService?: NotifyService
  ) {}

  afterInit(server: Server) {
    this.logger.log(' WebSocket Gateway Initialized');
    this.logger.log(` Listening on namespace: /notifications`);
  }

  handleConnection(client: Socket) {
    this.logger.log(` Client attempting to connect: ${client.id}`);
    
    const userId = client.handshake.query.userId as string;
    
    if (!userId || isNaN(Number(userId))) {
      this.logger.warn(` Connection rejected - Invalid userId: ${client.id}`);
      client.disconnect();
      return;
    }

    const userIdNum = Number(userId);
  
    this.connectedUsers.set(userIdNum, client.id);
    this.socketToUser.set(client.id, userIdNum);
    
    this.logger.log(
      `User ${userIdNum} connected with socket ${client.id} - Total users: ${this.connectedUsers.size}`,
    );
  
    client.emit('connected', {
      message: 'Conectado exitosamente al servidor de notificaciones',
      userId: userIdNum,
      timestamp: new Date(),
    });
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

      this.logger.log(
        `User ${userId} marking notification ${data.notificationId} as read`,
      );

      return {
        success: true,
        notificationId: data.notificationId,
      };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

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
