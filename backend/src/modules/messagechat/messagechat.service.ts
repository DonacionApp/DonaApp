import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageChatEntity } from './entity/message.chat.entity';
import { Repository } from 'typeorm';
import { TypemessageService } from '../typemessage/typemessage.service';
import { ChatService } from '../chat/chat.service';
import { UserService } from '../user/user.service';
import { CreateMessageDto } from './dto/create.message.dto';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { CLOUDINARY_CHATS_FOLDER, CLOUDINARY_FOLDER_BASE } from 'src/config/constants';
import { UserchatService } from '../userchat/userchat.service';
import { UserChatEntity } from '../userchat/entity/user.chat.entity';
import { read } from 'fs';
import { MessagechatGateway } from './messagechat.gateway';

@Injectable()
export class MessagechatService {
    constructor(
        @InjectRepository(MessageChatEntity)
        private readonly messageChatRepository: Repository<MessageChatEntity>,
        @Inject(forwardRef(() => TypemessageService))
        private readonly typemessageService: TypemessageService,
        @Inject(forwardRef(() => ChatService))
        private readonly chatService: ChatService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(() => UserchatService))
        private readonly userchatService: UserchatService,
        @Inject(forwardRef(() => CloudinaryService))
        private readonly cloudinaryService: CloudinaryService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => MessagechatGateway)) private readonly messagechatGateway: MessagechatGateway,
        @Inject(forwardRef(() => AuditService)) private readonly auditService: AuditService,
    ) { }

    async createMessageChat(currentUser: number, dto: CreateMessageDto, files?: Express.Multer.File[], admin?: boolean): Promise<any> {
        let action = 'messagechat.create';
        let payload = { dto, filesMeta: files?.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size })) };
        try {
            const chat = await this.chatService.getChatById(Number(dto.chatId));
            const hasFiles = Array.isArray(files) && files.length > 0;
            const hasText = typeof dto.messageText === 'string' && dto.messageText.trim().length > 0;
            if (!hasFiles && !hasText) {
                await this.auditService.createLog(currentUser, action, JSON.stringify({ message: 'mensaje o archivo son requeridos', payload }), 400, payload);
                throw new BadRequestException('mensaje o archivo son requeridos');
            }
            const userchat = await this.userchatService.verifyUserInChat(Number(currentUser), chat.id);
            if (!userchat && !admin) {
                await this.auditService.createLog(currentUser, action, JSON.stringify({ message: 'Usuario no pertenece al chat', payload }), 403, payload);
                throw new BadRequestException('Usuario no pertenece al chat');
            }
            const user = await this.userService.findById(Number(currentUser));
            const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
            const chatFolder = this.configService.get<string>(CLOUDINARY_CHATS_FOLDER);
            const folder = `${folderBase}/${chatFolder}/chat_${chat.id}`;
            const savedMessages: MessageChatEntity[] = [];
            if (hasFiles) {
                for (const file of files) {
                    const typeFile = file.mimetype.split('/')[0];
                    await this.cloudinaryService.validateTamaño(file);
                    let uploadResult: any = null;
                    let typeString = '';
                    if (typeFile === 'image') {
                        uploadResult = await this.cloudinaryService.uploadImage(folder, file);
                        typeString = 'imagen';
                    } else if (typeFile === 'video') {
                        uploadResult = await this.cloudinaryService.uploadVideo(folder, file);
                        typeString = 'video';
                    } else if (typeFile === 'audio') {
                        uploadResult = await this.cloudinaryService.uploadAudio(folder, file);
                        typeString = 'audio';
                    } else if (typeFile === 'application' && file.mimetype === 'application/pdf') {
                        uploadResult = await this.cloudinaryService.uploadPDF(folder, file);
                        typeString = 'documento';
                    } else {
                        await this.auditService.createLog(currentUser, action, JSON.stringify({ message: `Tipo de archivo no soportado: ${file.mimetype}`, payload }), 400, payload);
                        throw new BadRequestException(`Tipo de archivo no soportado: ${file.mimetype}`);
                    }
                    const fileUrl = (uploadResult && (uploadResult as any).secure_url) || (uploadResult && (uploadResult as any).url) || null;
                    const typeMessage = await this.typemessageService.getTypeByType(typeString);
                    if (!typeMessage || (typeMessage as any).status) {
                        await this.auditService.createLog(currentUser, action, JSON.stringify({ message: 'Tipo de mensaje no encontrado para el archivo subido', payload }), 400, payload);
                        throw new BadRequestException('Tipo de mensaje no encontrado para el archivo subido');
                    }
                    const newMessage = new MessageChatEntity();
                    newMessage.message = fileUrl || file.originalname;
                    newMessage.chat = chat;
                    newMessage.type = typeMessage as any;
                    newMessage.user = user as any;
                    const saved = await this.messageChatRepository.save(newMessage);
                    savedMessages.push(saved);
                }
            }
            if (hasText) {
                const typeMessage = await this.typemessageService.getTypeByType('texto');
                if (!typeMessage || (typeMessage as any).status) {
                    await this.auditService.createLog(currentUser, action, JSON.stringify({ message: 'Tipo de mensaje no encontrado para el mensaje de texto', payload }), 400, payload);
                    throw new BadRequestException('Tipo de mensaje no encontrado para el mensaje de texto');
                }
                const newMessage = new MessageChatEntity();
                newMessage.message = (dto.messageText as string).trim();
                newMessage.chat = chat;
                newMessage.type = typeMessage as any;
                newMessage.user = user as any;
                const saved = await this.messageChatRepository.save(newMessage);
                savedMessages.push(saved);
            }
            const messageMinimalInfo = savedMessages.map(msg => ({
                id: msg.id,
                message: msg.message,
                createdAt: msg.createdAt,
                user: {
                    id: msg.user.id,
                    username: msg.user.username,
                    profilePhoto: msg.user.profilePhoto,
                    verrified: msg.user.verified,
                    emailVerfied: msg.user.emailVerified,
                },
                type: msg.type ? { id: msg.type.id, type: msg.type.type } : null,
                read: msg.read,
            }));
            try {
                if (this.messagechatGateway && typeof this.messagechatGateway.notifyNewMessage === 'function') {
                    for (const m of messageMinimalInfo) {
                        await this.messagechatGateway.notifyNewMessage(chat.id, m);
                    }
                }
            } catch (e) {}
            await this.auditService.createLog(currentUser, action, JSON.stringify({ message: 'Mensajes enviados', payload, response: messageMinimalInfo }), 201, payload);
            return { messages: messageMinimalInfo, count: messageMinimalInfo.length };
        } catch (error) {
            await this.auditService.createLog(currentUser, action, JSON.stringify({ message: error?.message || 'Error al enviar mensaje', payload, response: error?.response }), error?.status || 500, payload);
            throw error;
        }
    }

    async getCountUnreadMessages(userId: number): Promise<{unreadcount: number}> {
        try {
            if(!userId || userId <= 0 || isNaN(userId) || userId === undefined) {
                throw new BadRequestException('userId es requerido y debe ser válido');
            }
            const count = await this.messageChatRepository.createQueryBuilder('message')
                .innerJoin(UserChatEntity, 'uc', 'uc.chatId = message.chatId AND uc.userId = :userId', { userId })
                .where('message.userId != :userId', { userId })
                .andWhere('message.read = :read', { read: false })
                .getCount();
            return {unreadcount: count};
        } catch (error) {
            throw error;
        }
    }

    async renameChat(chatId: number, newName: string, currentUserId: number): Promise<any> {
        try {
            if (!chatId || chatId <= 0 || !newName || newName.trim().length === 0) {
                throw new BadRequestException('chatId y newName son requeridos');
            }
            // Delegate to ChatService which will handle persistence and permissions
            const saved = await this.chatService.updateNameChat(chatId, newName);
            return saved;
        } catch (error) {
            throw error;
        }
    }

    async getMessagesByChatId(
        chatId: number,
        currentUser?: number,
        admin?: boolean,
        options?: { page?: number; limit?: number; searchParam?: string; type?: string | number; order?: 'ASC' | 'DESC'; }
    ): Promise<{ messages: MessageChatEntity[]; total: number; page: number; limit: number }> {
        try {
            const page = options?.page && options.page > 0 ? options.page : 1;
            const limit = options?.limit && options.limit > 0 ? options.limit : 20;
            const skip = (page - 1) * limit;
            const search = options?.searchParam?.trim();
            const typeFilter = options?.type;
            const order: 'ASC' | 'DESC' = options?.order === 'DESC' ? 'DESC' : 'ASC';

            const qb = this.messageChatRepository.createQueryBuilder('message')
                .leftJoinAndSelect('message.user', 'user')
                .leftJoinAndSelect('message.type', 'type')
                .where('message.chatId = :chatId', { chatId });
            if (admin !== true) {
                if (!currentUser || typeof currentUser !== 'number' || isNaN(currentUser) || currentUser <= 0) {
                    throw new BadRequestException('currentUser es requerido para verificar pertenencia al chat');
                }
                const userchat = await this.userchatService.verifyUserInChat(Number(currentUser), chatId);
                if (!userchat) {
                    throw new BadRequestException('Usuario no pertenece al chat');
                }
            }

            if (search) {
                qb.andWhere('LOWER(message.message) LIKE :search', { search: `%${search.toLowerCase()}%` });
            }

            if (typeFilter !== undefined && typeFilter !== null && typeFilter !== '') {
                if (typeof typeFilter === 'number' || String(typeFilter).match(/^\d+$/)) {
                    qb.andWhere('type.id = :typeId', { typeId: Number(typeFilter) });
                } else {
                    qb.andWhere('type.type = :typeName', { typeName: String(typeFilter) });
                }
            }

            qb.orderBy('message.createdAt', order)
                .skip(skip)
                .take(limit);

            const [messages, total] = await qb.getManyAndCount();
            const messageMinimalInfo = messages.map(msg => ({
                id: msg.id,
                message: msg.message,
                createdAt: msg.createdAt,
                user: {
                    id: msg.user.id,
                    username: msg.user.username,
                    profilePhoto: msg.user.profilePhoto,
                    verrified: msg.user.verified,
                    emailVerfied: msg.user.emailVerified,
                },
                type: {
                    id: msg.type.id,
                    type: msg.type.type,
                },
                read: msg.read,
            }));

            return { messages: messageMinimalInfo as any, total, page, limit };
        } catch (error) {
            throw error;
        }
    }

    async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
        try {
            if (!chatId || !userId || chatId <= 0 || userId <= 0 || userId === undefined || chatId === undefined) {
                throw new BadRequestException('chatId y userId son requeridos y deben ser mayores a 0');
            }
            const userchat = await this.userchatService.verifyUserInChat(Number(userId), chatId);
            if (!userchat) {
                throw new BadRequestException('Usuario no pertenece al chat');
            }
            await this.messageChatRepository.createQueryBuilder()
                .update(MessageChatEntity)
                .set({ read: true })
                .where('chatId = :chatId', { chatId })
                .andWhere('userId != :userId', { userId })
                .andWhere('read = :read', { read: false })
                .execute();

        } catch (error) {
            throw error;
        }
    }

    async countUnreadMessages(chatId: number, userId: number): Promise<number> {
        try {
            if (!chatId || !userId || chatId <= 0 || userId <= 0 || userId === undefined || chatId === undefined) {
                throw new BadRequestException('chatId y userId son requeridos y deben ser mayores a 0');
            }
            const userchat = await this.userchatService.verifyUserInChat(Number(userId), chatId);
            if (!userchat) {
                throw new BadRequestException('Usuario no pertenece al chat');
            }
            const count = await this.messageChatRepository.createQueryBuilder('message')
                .where('message.chatId = :chatId', { chatId })
                .andWhere('message.userId != :userId', { userId })
                .andWhere('message.read = :read', { read: false })
                .getCount();
            return count;
        } catch (error) {
            throw error;
        }
    }

    async countChatsWithUnread(userId: number): Promise<number> {
        try {
            if (!userId || userId <= 0 || isNaN(userId) || userId === undefined) {
                throw new BadRequestException('userId es requerido y debe ser válido');
            }
            const raw = await this.messageChatRepository.createQueryBuilder('m')
                .select('COUNT(DISTINCT m.chatId)', 'cnt')
                .innerJoin(UserChatEntity, 'uc', 'uc.chatId = m.chatId AND uc.userId = :userId', { userId })
                .where('m.userId != :userId', { userId })
                .andWhere('m.read = :read', { read: false })
                .getRawOne();
            const n = raw && (raw.cnt || raw.count) ? Number(raw.cnt || raw.count) : 0;
            return n;
        } catch (error) {
            throw error;
        }
    }

    async updateMessageChat(id: number, newMessageText: string, currentUserId: number): Promise<{ newMessage: string, status: number }> {
        let action = 'messagechat.update';
        let payload = { id, newMessageText, currentUserId };
        try {
            if (!id || id <= 0 || id === undefined || !newMessageText || newMessageText.trim().length === 0 || !currentUserId || currentUserId <= 0 || currentUserId === undefined) {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'id, newMessageText y currentUserId son requeridos y deben ser mayores a 0', payload }), 400, payload);
                throw new BadRequestException('id, newMessageText y currentUserId son requeridos y deben ser mayores a 0');
            }
            const message = await this.messageChatRepository.createQueryBuilder('message')
                .where('message.id = :id', { id })
                .leftJoinAndSelect('message.type', 'type')
                .leftJoinAndSelect('message.user', 'user')
                .getOne();
            if (!message) {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'Mensaje no encontrado', payload }), 404, payload);
                throw new BadRequestException('Mensaje no encontrado');
            }
            if (message.user.id !== currentUserId) {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'No tienes permiso para editar este mensaje', payload }), 403, payload);
                throw new BadRequestException('No tienes permiso para editar este mensaje');
            }
            if (message.type.type !== 'texto') {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'Solo los mensajes de texto pueden ser editados', payload }), 400, payload);
                throw new BadRequestException('Solo los mensajes de texto pueden ser editados');
            }
            message.message = newMessageText;
            const saved = await this.messageChatRepository.save(message);
            const messageMinimal = {
                id: saved.id,
                message: saved.message,
                createdAt: saved.createdAt,
                user: saved.user ? { id: saved.user.id, username: saved.user.username, profilePhoto: saved.user.profilePhoto } : null,
            } as any;
            try {
                if (this.messagechatGateway && typeof this.messagechatGateway.notifyEditMessage === 'function') {
                    this.messagechatGateway.notifyEditMessage(saved.chat?.id, messageMinimal);
                }
            } catch (e) {}
            await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'Mensaje editado', payload, response: messageMinimal }), 200, payload);
            return { newMessage: saved.message, status: 200, id: saved.id, chatId: saved.chat?.id } as any;
        } catch (error) {
            await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: error?.message || 'Error al editar mensaje', payload, response: error?.response }), error?.status || 500, payload);
            throw error;
        }
    }

    async deleteMessageChat(id: number, currentUserId: number, admin?: boolean): Promise<{ message: string, status: number }> {
        let action = 'messagechat.delete';
        let payload = { id, currentUserId, admin };
        try {
            if (!id || id <= 0 || id === undefined || !currentUserId || currentUserId <= 0 || currentUserId === undefined) {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'id y currentUserId son requeridos y deben ser mayores a 0', payload }), 400, payload);
                throw new BadRequestException('id y currentUserId son requeridos y deben ser mayores a 0');
            }
            const message = await this.messageChatRepository.createQueryBuilder('message')
                .where('message.id = :id', { id })
                .leftJoinAndSelect('message.user', 'user')
                .leftJoinAndSelect('message.chat', 'chat')
                .leftJoinAndSelect('message.type', 'type')
                .getOne();
            if (!message) {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'Mensaje no encontrado', payload }), 404, payload);
                throw new BadRequestException('Mensaje no encontrado');
            }
            if (!admin && message.user.id !== currentUserId) {
                await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'No tienes permiso para eliminar este mensaje', payload }), 403, payload);
                throw new BadRequestException('No tienes permiso para eliminar este mensaje');
            }
            const typeMessage = message.type.type;
            if (typeMessage !== 'texto') {
                const publicId = message.message.split('/').pop()?.split('.').shift() || null;
                if (!publicId) {
                    await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'No se pudo obtener el publicId del archivo asociado al mensaje', payload }), 400, payload);
                    throw new BadRequestException('No se pudo obtener el publicId del archivo asociado al mensaje');
                }
                const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
                const chatFolder = this.configService.get<string>(CLOUDINARY_CHATS_FOLDER);
                const folder = `${folderBase}/${chatFolder}/chat_${message.chat.id}`;
                await this.cloudinaryService.deleteFile(folder, publicId);
            }
            const chatId = message.chat?.id;
            const messageId = message.id;
            await this.messageChatRepository.remove(message);
            try {
                if (this.messagechatGateway && typeof this.messagechatGateway.notifyDeleteMessage === 'function') {
                    this.messagechatGateway.notifyDeleteMessage(chatId, messageId);
                }
            } catch (e) {}
            await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: 'Mensaje eliminado correctamente', payload, response: { chatId, messageId } }), 200, payload);
            return { message: 'Mensaje eliminado correctamente', status: 200, chatId, id: messageId } as any;
        } catch (error) {
            await this.auditService.createLog(currentUserId, action, JSON.stringify({ message: error?.message || 'Error al eliminar mensaje', payload, response: error?.response }), error?.status || 500, payload);
            throw error;
        }
    }
}