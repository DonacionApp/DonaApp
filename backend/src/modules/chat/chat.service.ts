import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from './entity/chat.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';
import { CreateChatDto } from './dto/create.chat.dto';
import { UserchatService } from '../userchat/userchat.service';
import { DonationService } from '../donation/donation.service';
import { UserService } from '../user/user.service';
import { ChatstatusService } from '../chatstatus/chatstatus.service';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatEntity)
        private readonly chatRepository: Repository<ChatEntity>,
        @Inject(forwardRef(()=>UserchatService))
        private readonly userchatService: UserchatService,
        @Inject(forwardRef(()=> DonationService))
        private readonly donationService: DonationService,
        @Inject(forwardRef(()=> UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(()=> ChatstatusService))
        private readonly chatstatusService: ChatstatusService,
    ) { }

    async getChatById(chatId: number): Promise<ChatEntity> {
        try {
            if (!chatId || chatId <= 0 || isNaN(chatId) || chatId === undefined) {
                throw new BadRequestException('El ID del chat es inválido');
            }
            const chat = await this.chatRepository.createQueryBuilder('chat')
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
                return {messageChat: 'No existe un chat para esta donación y usuario', status:404} as any;
            }
            return chat;
        } catch (error) {
            throw error;
        }
    }

    async createChat(dto:CreateChatDto, admin?:boolean): Promise<ChatEntity>{
        try {
            let errorUsers:string[] = [];
            const participants = Array.isArray(dto.participantIds) ? dto.participantIds : [];
            if (participants.length === 0) {
                throw new BadRequestException('Debe agregar al menos un participante al chat');
            }
            if (participants.length > 50) {
                throw new BadRequestException('No se pueden agregar más de 50 participantes al chat');
            }
            if(!dto.chatName || dto.chatName.trim().length===0){
                throw new BadRequestException('El nombre del chat no puede estar vacío');
            }
            for(const userId of participants){
                try {
                    await this.userService.findById(userId.userId);
                } catch (error) {
                    errorUsers.push(`Usuario con ID ${userId.userId} no encontrado`);
                }
            }
            if(errorUsers.length>0){
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

            // Agregar participantes
            for (const p of participants) {
                try {
                    await this.userchatService.addUserToChat({ chatId: savedChat.id, userId: p.userId, donator: !!p.isDonator, admin: !!p.isAdmin } as any);
                } catch (err) {
                    // si agregar un participante falla, continuamos con los demás y acumulamos (no revertimos)
                }
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

            return savedChat;
        } catch (error) {
            throw error;
        }
    }
}
