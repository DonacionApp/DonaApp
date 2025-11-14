import { Logger, Inject, forwardRef } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagechatService } from './messagechat.service';
import { UserchatService } from '../userchat/userchat.service';

@WebSocketGateway({ cors: true, namespace: '/' })
export class MessagechatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagechatGateway.name);

  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();
  private socketUser: Map<string, number> = new Map();
  private socketChat: Map<string, number> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => MessagechatService))
    private readonly messagechatService: MessagechatService,
    private readonly userchatService: UserchatService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake?.auth?.token || (socket.handshake?.headers?.authorization || '').replace(/^Bearer\s+/i, '') || null;
      if (!token) {
        this.logger.warn(`Socket ${socket.id} missing token, disconnecting`);
        socket.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token).catch(() => null);
      if (!payload) {
        this.logger.warn(`Socket ${socket.id} invalid token, disconnecting`);
        socket.disconnect(true);
        return;
      }

      const userId = Number((payload as any).id ?? (payload as any).sub ?? null);
      if (!userId || isNaN(userId)) {
        this.logger.warn(`Socket ${socket.id} token missing user id, disconnecting`);
        socket.disconnect(true);
        return;
      }

      this.socketUser.set(socket.id, userId);
      const set = this.userSockets.get(userId) || new Set<string>();
      set.add(socket.id);
      this.userSockets.set(userId, set);

      this.logger.log(`User ${userId} connected on socket ${socket.id}`);
      this.server.to(socket.id).emit('connected', { userId });
    } catch (e) {
      this.logger.error('Error during socket connection', e as any);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket) {
    try {
      const userId = this.socketUser.get(socket.id);
      this.socketUser.delete(socket.id);
      this.socketChat.delete(socket.id);
      if (userId) {
        const set = this.userSockets.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) this.userSockets.delete(userId);
          else this.userSockets.set(userId, set);
        }
        this.logger.log(`User ${userId} disconnected socket ${socket.id}`);
      } else {
        this.logger.log(`Socket ${socket.id} disconnected`);
      }
    } catch (e) {
      this.logger.error('Error during disconnect', e as any);
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(@MessageBody() payload: { chatId: number }, @ConnectedSocket() socket: Socket) {
    const chatId = Number(payload?.chatId);
    const userId = this.socketUser.get(socket.id);
    if (!userId || !chatId) return;

    try {
      const inChat = await this.userchatService.verifyUserInChat(userId, chatId).catch(() => null);
      if (!inChat) {
        socket.emit('error', { message: 'No pertenece al chat' });
        return;
      }

      socket.join(this.getRoomName(chatId));
      this.socketChat.set(socket.id, chatId);
      this.logger.log(`User ${userId} joined chat ${chatId} on socket ${socket.id}`);

      try {
        await this.messagechatService.markMessagesAsRead(chatId, userId);
        this.server.to(this.getRoomName(chatId)).emit('chat:read', { chatId, userId });
      } catch (e) {
        this.logger.warn('Could not mark messages as read', e as any);
      }

      socket.emit('joinedChat', { chatId });
    } catch (e) {
      socket.emit('error', { message: 'Unable to join chat' });
    }
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(@MessageBody() payload: { chatId: number }, @ConnectedSocket() socket: Socket) {
    const chatId = Number(payload?.chatId);
    const userId = this.socketUser.get(socket.id);
    if (!userId || !chatId) return;
    socket.leave(this.getRoomName(chatId));
    this.socketChat.delete(socket.id);
    this.logger.log(`User ${userId} left chat ${chatId}`);
    socket.emit('leftChat', { chatId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() payload: any, @ConnectedSocket() socket: Socket) {
    const userId = this.socketUser.get(socket.id);
    const chatId = Number(payload?.chatId || this.socketChat.get(socket.id));
    const text = String(payload?.message || '').trim();
    if (!userId || !chatId || !text) {
      socket.emit('error', { message: 'Invalid send message payload' });
      return;
    }

    try {
      const dto: any = { chatId, messageText: text };
      const result = await this.messagechatService.createMessageChat(userId, dto as any);
      const created = result && Array.isArray(result.messages) ? result.messages : [];

      const room = this.getRoomName(chatId);

      if (Array.isArray(created) && created.length === 1) {
        this.server.to(room).emit('message:new', { chatId, message: created[0] });
      } else {
        this.server.to(room).emit('message:new', { chatId, messages: created });
      }

      const socketsInRoom = await this.server.in(room).allSockets();

      for (const [otherUserId, sockets] of this.userSockets.entries()) {
        if (otherUserId === userId) continue;
        const userHasSocketInRoom = Array.from(sockets).some(sId => socketsInRoom.has(sId));
        if (userHasSocketInRoom) continue;
        for (const sId of sockets) {
          if (Array.isArray(created) && created.length === 1) {
            this.server.to(sId).emit('notification:message', { chatId, message: created[0] });
          } else {
            this.server.to(sId).emit('notification:message', { chatId, messages: created });
          }
          try {
            const unreadInChat = await this.messagechatService.countUnreadMessages(chatId, otherUserId).catch(() => 0);
            const totalUnreadChats = await this.messagechatService.countChatsWithUnread(otherUserId).catch(() => 0);
            this.server.to(sId).emit('notification:unreadChats', { chatId, unreadInChat, totalUnreadChats });
          } catch (e) {
          }
        }
      }
    } catch (e) {
      this.logger.error('Error sending message via websocket', e as any);
      socket.emit('error', { message: 'Error sending message' });
    }
  }

  async notifyNewMessage(chatId: number, messageMinimal: any) {
    try {
      this.server.to(this.getRoomName(chatId)).emit('message:new', { chatId, message: messageMinimal });

      const participants = await this.userchatService.getUsersChatByChatId(chatId).catch(() => [] as any[]);
      const room = this.getRoomName(chatId);
      const socketsInRoom = await this.server.in(room).allSockets();
      for (const uc of participants) {
        const uid = uc?.user?.id;
        if (!uid) continue;
        const sockets = this.userSockets.get(uid);
        const hasSocketInChat = sockets ? Array.from(sockets).some(sId => socketsInRoom.has(sId)) : false;
        if (hasSocketInChat) {
          try {
            await this.messagechatService.markMessagesAsRead(chatId, uid);
          } catch (e) {
            this.logger.warn('Unable to mark messages as read', e as any);
          }
        } else {
          if (sockets) {
            for (const sId of sockets) {
              this.server.to(sId).emit('notification:message', { chatId, message: messageMinimal });
              try {
                const unreadInChat = await this.messagechatService.countUnreadMessages(chatId, uid).catch(() => 0);
                const totalUnreadChats = await this.messagechatService.countChatsWithUnread(uid).catch(() => 0);
                this.server.to(sId).emit('notification:unreadChats', { chatId, unreadInChat, totalUnreadChats });
              } catch (e) {
              }
            }
          }
        }
      }
    } catch (e) {
      this.logger.error('Error in notifyNewMessage', e as any);
    }
  }

  private getRoomName(chatId: number) {
    return `chat_${chatId}`;
  }
}
