import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from './entity/chat.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';
import { CreateChatDto } from './dto/create.chat.dto';
import { UserchatService } from '../userchat/userchat.service';
import { DonationService } from '../donation/donation.service';
import { UserService } from '../user/user.service';
import { ChatstatusService } from '../chatstatus/chatstatus.service';
import { MessagechatGateway } from '../messagechat/messagechat.gateway';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatEntity)
        private readonly chatRepository: Repository<ChatEntity>,
        @Inject(forwardRef(() => UserchatService))
        private readonly userchatService: UserchatService,
        @Inject(forwardRef(() => DonationService))
        private readonly donationService: DonationService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(() => ChatstatusService))
        private readonly chatstatusService: ChatstatusService,
        @Inject(forwardRef(()=> MessagechatGateway))
        private readonly messagechatGateway: MessagechatGateway,
    ) { }

    async getChatById(chatId: number): Promise<ChatEntity> {
        try {
            if (!chatId || chatId <= 0 || isNaN(chatId) || chatId === undefined) {
                throw new BadRequestException('El ID del chat es inválido');
            }
            const chat = await this.chatRepository.createQueryBuilder('chat')
                .leftJoinAndSelect('chat.chatStatus', 'chatStatus')
                .where('chat.id = :chatId', { chatId })
                .getOne();
            if (!chat) {
                throw new NotFoundException('Chat no encontrado');
            }
            return chat;
        } catch (error) {
            throw error;
        }
    }

    async getChatFronDonationId(donationId: number, currentUser: any): Promise<ChatEntity> {
        try {
            if (!donationId || donationId <= 0 || isNaN(donationId) || donationId === undefined) {
                throw new BadRequestException('El ID de la donación es inválido');
            }
            if (!currentUser || currentUser <= 0 || isNaN(currentUser) || currentUser === undefined) {
                throw new BadRequestException('El ID del usuario es inválido');
            }
            const chat = await this.chatRepository.createQueryBuilder('chat')
                .leftJoinAndSelect('chat.userChat', 'uc')
                .where('chat.donationId = :donationId', { donationId })
                .getOne();
            if (!chat) {
                return { messageChat: 'No existe un chat para esta donación y usuario', status: 404 } as any;
            }
            return chat;
        } catch (error) {
            throw error;
        }
    }

    async createChat(dto: CreateChatDto, admin?: boolean): Promise<ChatEntity> {
        try {
            let errorUsers: string[] = [];
            const participants = Array.isArray(dto.participantIds) ? dto.participantIds : [];
            if (participants.length === 0) {
                throw new BadRequestException('Debe agregar al menos un participante al chat');
            }
            if (participants.length > 50) {
                throw new BadRequestException('No se pueden agregar más de 50 participantes al chat');
            }
            if (!dto.chatName || dto.chatName.trim().length === 0) {
                throw new BadRequestException('El nombre del chat no puede estar vacío');
            }
            for (const userId of participants) {
                try {
                    await this.userService.findById(userId.userId);
                } catch (error) {
                    errorUsers.push(`Usuario con ID ${userId.userId} no encontrado`);
                }
            }
            if (errorUsers.length > 0) {
                throw new BadRequestException(`Errores con los usuarios: ${errorUsers.join(', ')}`);
            }

            let chatStatus: any = await this.chatstatusService.getStatusByType('open') as any;
            if (!chatStatus || (chatStatus as any).status) {
                const all = await this.chatstatusService.getAllStatus() as any[];
                chatStatus = Array.isArray(all) && all.length > 0 ? all[0] : null;
            }

            const newChat = this.chatRepository.create({
                chatName: dto.chatName,
                chatStatus: chatStatus ? { id: chatStatus.id } : undefined,
                donation: dto.donationId ? { id: dto.donationId } : null,
            });
            const savedChat = await this.chatRepository.save(newChat);

            for (const p of participants) {
                try {
                    await this.userchatService.addUserToChat({ chatId: savedChat.id, userId: p.userId, donator: !!p.isDonator, admin: !!p.isAdmin } as any);
                } catch (err) {
                    }
            }

                    try {
                        if (this.messagechatGateway && typeof this.messagechatGateway.notifyNewChat === 'function') {
                            this.messagechatGateway.notifyNewChat(savedChat);
                        }
                    } catch (e) {
                    }

                    return savedChat;
        } catch (error) {
            throw error;
        }
    }

    async createChatFromDonation(
        dto: { donationId: number; beneficiaryId?: number; title?: string },
        currentUser?: number,
        admin?: boolean,
    ): Promise<ChatEntity> {
        try {
            const donationId = Number(dto.donationId);
            if (!donationId || isNaN(donationId) || donationId <= 0) {
                throw new BadRequestException('donationId es requerido y debe ser válido');
            }

            const donation = await this.donationService.getDonationById(donationId);
            if (!donation) {
                throw new BadRequestException('Donación no encontrada');
            }

            const donationFormatted = donation as any;
            const donator = donationFormatted.donator as any;
            const beneficiary = donationFormatted.beneficiary as any;
            const beneficiaryId = dto.beneficiaryId ? Number(dto.beneficiaryId) : beneficiary?.id;
            if (!beneficiaryId) {
                throw new BadRequestException('Beneficiario no encontrado en la donación y no fue proporcionado');
            }

            if (admin !== true) {
                if (!currentUser || (currentUser !== (donator && donator.id) && currentUser !== (beneficiary && beneficiary.id))) {
                    throw new BadRequestException('currentUser no forma parte de la donación');
                }
            }

            const existing = await this.chatRepository.createQueryBuilder('chat')
                .leftJoin('chat.userChat', 'uc')
                .where('chat.donationId = :donationId', { donationId })
                .andWhere('uc.userId = :beneficiaryId', { beneficiaryId })
                .getOne();
            if (existing) {
                throw new BadRequestException('Ya existe un chat para esta donación y beneficiario');
            }

            const beneficiaryUser = beneficiary || (await this.userService.findById(beneficiaryId));
            const postTitle = donation.post?.title || '';
            const chatName = dto.title && dto.title.trim().length > 0 ? `${beneficiaryUser.username} - ${dto.title.trim()}` : `${beneficiaryUser.username} - ${postTitle || 'donación'}`;

            let chatStatus: any = await this.chatstatusService.getStatusByType('activo') as any;
            if (!chatStatus || (chatStatus as any).status) {
                const all = await this.chatstatusService.getAllStatus() as any[];
                chatStatus = Array.isArray(all) && all.length > 0 ? all[0] : null;
            }

            const newChat = this.chatRepository.create({
                chatName,
                chatStatus: chatStatus ? { id: chatStatus.id } : undefined,
                donation: { id: donationId },
            });
            const savedChat = await this.chatRepository.save(newChat);

            const donatorId = donator?.id;
            if (donatorId) {
                await this.userchatService.addUserToChat({ chatId: savedChat.id, userId: donatorId, donator: true } as any);
            }
            await this.userchatService.addUserToChat({ chatId: savedChat.id, userId: beneficiaryId, donator: false } as any);

            try {
                if (this.messagechatGateway && typeof this.messagechatGateway.notifyNewChat === 'function') {
                    this.messagechatGateway.notifyNewChat(savedChat);
                }
            } catch (e) {
                console.warn('Error notifying new chat via WebSocket:', e);
            }

            return savedChat;
        } catch (error) {
            throw error;
        }
    }

    async getChatsByUserId(userId: number, options?: { searchParam?: string; cursor?: string; limit?: number; page?: number; offset?: number }): Promise<ChatEntity[]> {
        try {
            if (!userId || userId <= 0 || isNaN(userId) || userId === undefined) {
                throw new BadRequestException('El ID del usuario es inválido');
            }

            const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
            let offset = Number(options?.offset) || 0;
            if (options?.page && Number(options.page) > 0) {
                offset = (Number(options.page) - 1) * limit;
            }

            const search = options?.searchParam ? String(options.searchParam).trim() : null;
            const cursor = options?.cursor ? new Date(String(options.cursor)) : null;

            const qb = this.chatRepository.createQueryBuilder('chat')
                .leftJoinAndSelect('chat.userChat', 'uc')
                .leftJoinAndSelect('uc.user', 'user')
                .leftJoinAndSelect('chat.chatStatus', 'chatStatus')
                .where('uc.userId = :userId', { userId });

            if (search && search.length > 0) {
                const like = `%${search}%`;
                qb.andWhere(new Brackets(b => {
                    b.where('chat.chatName ILIKE :like', { like })
                        .orWhere('user.username ILIKE :like', { like });
                }));
            }

            if (cursor && !isNaN(cursor.getTime())) {
                // Infinite scroll: return items older than cursor
                qb.andWhere('chat.createdAt < :cursor', { cursor: cursor.toISOString() });
            } else {
                // offset pagination when no cursor
                qb.skip(offset);
            }

            qb.orderBy('chat.createdAt', 'DESC')
                .take(limit);

            const chats = await qb.getMany();
            return chats;
        } catch (error) {
            throw error;
        }
    }

    async getAllChatsAdmin(
        filters?: any,
        options?: { limit?: number; page?: number; offset?: number; cursor?: string; orderBy?: string; order?: 'ASC' | 'DESC' }
    ): Promise<{ items: ChatEntity[]; total?: number; page?: number; limit?: number }> {
        try {
            const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
            let offset = Number(options?.offset) || 0;
            if (options?.page && Number(options.page) > 0) {
                offset = (Number(options.page) - 1) * limit;
            }

            const cursor = options?.cursor ? new Date(String(options.cursor)) : null;
            const orderField = options?.orderBy === 'updatedAt' ? 'last_message_at' : 'last_message_at';
            const orderDir = (options?.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const qb = this.chatRepository.createQueryBuilder('chat')
                .leftJoinAndSelect('chat.userChat', 'uc')
                .leftJoinAndSelect('uc.user', 'user')
                .leftJoin('chat.messageChat', 'm')
                .select(['chat', 'uc', 'user'])
                .addSelect('MAX(m.createdAt)', 'last_message_at')
                .groupBy('chat.id')
                .addGroupBy('uc.id')
                .addGroupBy('user.id');

            if (filters) {
                if (filters.search) {
                    const like = `%${String(filters.search).trim()}%`;
                    qb.andWhere(new Brackets(b => {
                        b.where('chat.chatName ILIKE :like', { like })
                            .orWhere('user.username ILIKE :like', { like });
                    }));
                }
                if (filters.donationId) {
                    qb.andWhere('chat.donationId = :donationId', { donationId: Number(filters.donationId) });
                }
                if (filters.statusId) {
                    qb.leftJoin('chat.chatStatus', 'cs').andWhere('cs.id = :statusId', { statusId: Number(filters.statusId) });
                }
            }

            if (cursor && !isNaN(cursor.getTime())) {
                qb.having('MAX(m.createdAt) < :cursor', { cursor: cursor.toISOString() });
            } else {
                qb.offset(offset);
            }

            qb.orderBy(orderField, orderDir)
                .limit(limit);

            const items = await qb.getRawAndEntities();

            const responseItems = items.entities.map((ch, idx) => {
                const rawRow = items.raw[idx];
                // Sanitize nested user objects to remove sensitive fields
                if (Array.isArray((ch as any).userChat)) {
                    (ch as any).userChat = (ch as any).userChat.map((uc: any) => {
                        if (!uc) return uc;
                        const user = uc.user;
                        if (!user || typeof user !== 'object') return uc;
                        const sanitized = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            profilePhoto: user.profilePhoto,
                            lastLogin: user.lastLogin,
                            emailVerified: user.emailVerified,
                            verified: user.verified,
                            block: user.block,
                            location: user.location,
                            createdAt: user.createdAt,
                            updatedAt: user.updatedAt,
                        };
                        return {
                            ...uc,
                            user: sanitized,
                        };
                    });
                }
                return ch;
            });

            let total: number | undefined = undefined;
            if (!cursor) {
                const countQb = this.chatRepository.createQueryBuilder('chat')
                    .leftJoin('chat.userChat', 'uc')
                    .leftJoin('uc.user', 'user');
                if (filters?.search) {
                    const like = `%${String(filters.search).trim()}%`;
                    countQb.where(new Brackets(b => {
                        b.where('chat.chatName ILIKE :like', { like })
                            .orWhere('user.username ILIKE :like', { like });
                    }));
                }
                if (filters?.donationId) {
                    countQb.andWhere('chat.donationId = :donationId', { donationId: Number(filters.donationId) });
                }
                total = await countQb.getCount();
            }

            return { items: responseItems, total, page: options?.page ? Number(options.page) : undefined, limit };
        } catch (error) {
            throw error;
        }
    }

    async updateNameChat(chatId: number, newName: string): Promise<ChatEntity> {
        try {
            if (!chatId || chatId <= 0 || isNaN(chatId) || chatId === undefined) {
                throw new BadRequestException('El ID del chat es inválido');
            }
            if (!newName || newName.trim().length === 0) {
                throw new BadRequestException('El nuevo nombre del chat no puede estar vacío');
            }
            const chat = await this.getChatById(chatId);
            chat.chatName = newName.trim();
            return await this.chatRepository.save(chat);
        } catch (error) {
            throw error;
        }
    }

    async closeChat(chatId: number, currentUser:number, admin?:boolean): Promise<{messageChat:string, status:number}> {
        try {
            if (!chatId || chatId <= 0 || isNaN(chatId) || chatId === undefined) {
                throw new BadRequestException('El ID del chat es inválido');
            }
            const chat = await this.chatRepository.createQueryBuilder('chat')
                .leftJoinAndSelect('chat.chatStatus', 'chatStatus')
                .leftJoinAndSelect('chat.userChat', 'uc')
                .leftJoinAndSelect('uc.user', 'user')
                .leftJoinAndSelect('chat.donation', 'donation')
                .leftJoinAndSelect('donation.statusDonation', 'donationStatus')
                .where('chat.id = :chatId', { chatId })
                .getOne();
            if (!chat) {
                throw new NotFoundException('Chat no encontrado');
            }
            let currentUserId: number | undefined = undefined;
            if (currentUser && typeof currentUser === 'object') {
                currentUserId = Number((currentUser as any).id ?? (currentUser as any).sub ?? undefined);
            } else {
                currentUserId = typeof currentUser === 'number' || (typeof currentUser === 'string' && !isNaN(Number(currentUser))) ? Number(currentUser) : undefined;
            }

            if (!admin) {
                const donationStatus = (chat as any).donation?.statusDonation?.status?.toString?.().toLowerCase?.() || null;
                const isDonationFinal = donationStatus && (donationStatus.includes('complet') || donationStatus.includes('entreg'));
                if (!isDonationFinal) {
                    const isDonator = Array.isArray(chat.userChat) && chat.userChat.some((uc: any) => (uc.donator === true || uc.donator === 1) && uc.user && Number(uc.user.id) === Number(currentUserId));
                    if (!isDonator) {
                        throw new ForbiddenException('Solo el donador puede cerrar el chat');
                    }
                }
            }
            const closedStatus = await this.chatstatusService.getStatusByType('closed');
            if (!closedStatus) {
                throw new BadRequestException('No se encontró el estado cerrado para el chat');
            }
            if (!(closedStatus as any).id) {
                throw new BadRequestException('Estado cerrado inválido');
            }
            chat.chatStatus = closedStatus as any;
             await this.chatRepository.save(chat);
             return {messageChat: 'Chat cerrado exitosamente', status:200};
        } catch (error) {
            throw error;
        }
    }

}
