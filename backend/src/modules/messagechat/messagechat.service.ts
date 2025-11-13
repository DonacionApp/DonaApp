import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { read } from 'fs';

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
        private readonly configService: ConfigService
    ) { }

    async createMessageChat(currentUser: number, dto: CreateMessageDto, file?: Express.Multer.File): Promise<any> {
        try {
            const chat = await this.chatService.getChatById(Number(dto.chatId));
            if (!dto.messageText && !file) {
                throw new BadRequestException('mensaje o archivo son requeridos');
            }
            if (!dto.messageText && file) {
                const typeFile = file.mimetype.split('/')[0];
                await this.cloudinaryService.validateTamaño(file);

                const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
                const chatFolder = this.configService.get<string>(CLOUDINARY_CHATS_FOLDER);
                const folder = `${folderBase}/${chatFolder}/chat_${chat.id}`;

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
                    throw new BadRequestException(`Tipo de archivo no soportado: ${file.mimetype}`);
                }

                const fileUrl = (uploadResult && (uploadResult as any).secure_url) || (uploadResult && (uploadResult as any).url) || null;

                const typeMessage = await this.typemessageService.getTypeByType(typeString);
                if (!typeMessage || (typeMessage as any).status) {
                    throw new BadRequestException('Tipo de mensaje no encontrado para el archivo subido');
                }

                const user = await this.userService.findById(Number(currentUser));
                const userchat = await this.userchatService.verifyUserInChat(Number(currentUser), chat.id);
                if (!userchat) {
                    throw new BadRequestException('Usuario no pertenece al chat');
                }
                const newMessage = new MessageChatEntity();
                newMessage.message = fileUrl || file.originalname;
                newMessage.chat = chat;
                newMessage.type = typeMessage as any;
                newMessage.user = user as any;

                const saved = await this.messageChatRepository.save(newMessage);
                return saved;
            }
            else if (dto.messageText) {
                const typeMessage = await this.typemessageService.getTypeByType('texto');
                if (!typeMessage || (typeMessage as any).status) {
                    throw new BadRequestException('Tipo de mensaje no encontrado para el mensaje de texto');
                }
                const userchat = await this.userchatService.verifyUserInChat(Number(currentUser), chat.id);
                if (!userchat) {
                    throw new BadRequestException('Usuario no pertenece al chat');
                }
                const user = await this.userService.findById(Number(currentUser));

                const newMessage = new MessageChatEntity();
                newMessage.message = dto.messageText;
                newMessage.chat = chat;
                newMessage.type = typeMessage as any;
                newMessage.user = user as any;
                const saved = await this.messageChatRepository.save(newMessage);
                return saved;
            } else {
                throw new BadRequestException('mensaje o archivo son requeridos');
            }
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
                    profilePhoto:msg.user.profilePhoto,
                    verrified:msg.user.verified,
                    emailVerfied:msg.user.emailVerified,
                },
                type: {
                    id: msg.type.id,
                    type: msg.type.type,
                },
                read:msg.read,
            }));

            return { messages: messageMinimalInfo as any, total, page, limit };
        } catch (error) {
            throw error;
        }
    }

}
