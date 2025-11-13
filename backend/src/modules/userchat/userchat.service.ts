import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserChatEntity } from './entity/user.chat.entity';
import { Repository, Brackets } from 'typeorm';
import { AddChatToUserDto } from './dto/add.to.chat.dto';
import { UserService } from '../user/user.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class UserchatService {
    constructor(
        @InjectRepository(UserChatEntity)
        private readonly userChatRepository: Repository<UserChatEntity>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(() => ChatService))
        private readonly chatService:ChatService,
    ){}

    async addUserToChat(dto:AddChatToUserDto):Promise<UserChatEntity>{
        try {
            const userExist=await this.userService.findById(Number(dto.userId));
            if(!userExist){
                throw new BadRequestException('Usuario no encontrado');
            }
            const chatExist= await this.chatService.getChatById(Number(dto.chatId));
            if(!chatExist){
                throw new BadRequestException('Chat no encontrado');
            }
            const userChatExist= await this.userChatRepository.createQueryBuilder('uc')
                .where('uc.userId = :userId', {userId: userExist.id})
                .andWhere('uc.chatId = :chatId', {chatId: chatExist.id})
                .getOne();
            if(userChatExist){
                throw new BadRequestException('El usuario ya pertenece al chat');
            }
            const newUserChat= this.userChatRepository.create({
                user: {id: userExist.id},
                chat: {id: chatExist.id},
            });
            if(dto.admin && dto.admin === true){
                newUserChat.admin= true;
            }
            if(dto.donator && dto.donator === true){
                newUserChat.donator= true;
            }
            return await this.userChatRepository.save(newUserChat);
        } catch (error ) {
            throw error;
        }
    }

    async removeUserFromChat(userId:number, chatId:number):Promise<void>{
        try {
            if(!userId || !chatId || userId <=0 || chatId <=0 || isNaN(userId) || isNaN(chatId) || typeof userId !== 'number' || typeof chatId !== 'number'){
                throw new BadRequestException('userId y chatId son necesarios');
            }
            const userChatExist= await this.userChatRepository.createQueryBuilder('uc')
                .where('uc.userId = :userId', {userId: userId})
                .andWhere('uc.chatId = :chatId', {chatId: chatId})
                .getOne();
            if(!userChatExist){
                throw new BadRequestException('El usuario no pertenece al chat');
            }
            await this.userChatRepository.remove(userChatExist);
        } catch (error) {
            throw error;
        }
    }

    async updateDonatorStatus(userId:number, chatId:number, donator:boolean):Promise<UserChatEntity>{
        try {
            if(!userId || !chatId || userId <=0 || chatId <=0 || isNaN(userId) || isNaN(chatId) || typeof userId !== 'number' || typeof chatId !== 'number'){
                throw new BadRequestException('userId y chatId son necesarios');
            }
            const userChatExist= await this.userChatRepository.createQueryBuilder('uc')
                .where('uc.userId = :userId', {userId: userId})
                .andWhere('uc.chatId = :chatId', {chatId: chatId})
                .getOne();
            if(!userChatExist){
                throw new NotFoundException('El usuario no pertenece al chat');
            }
            userChatExist.donator = donator;
            return await this.userChatRepository.save(userChatExist);
        } catch (error) {
            throw error;
        }
    
    }

    async getMyChatsByUserId(userId:number, options?: any):Promise<{ items: any[]; nextCursor?: string }>{
        try {
            if(!userId || userId <=0 || isNaN(userId) || typeof userId !== 'number'){
                throw new BadRequestException('userId es necesario');
            }

            const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
            const cursor = options?.cursor ? String(options.cursor) : null;
            const search = options?.search ? String(options.search).toLowerCase() : null;
            const orderBy = options?.orderBy === 'chatName' ? 'chatName' : 'lastMessage';
            const order = (String(options?.order || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

            const qb = this.userChatRepository.createQueryBuilder('uc')
                .leftJoin('uc.chat', 'chat')
                .leftJoinAndSelect('chat.chatStatus', 'chatStatus')
                .leftJoinAndSelect('chat.donation', 'donation')
                .where('uc.userId = :userId', { userId });

            qb.addSelect(['chat.id', 'chat.updatedAt', 'chat.chatName']);

            if (search && search.trim().length > 0) {
                qb.andWhere(new Brackets((b) => {
                    b.where('LOWER(chat.chatName) ILIKE :search', { search: `%${search}%` })
                     .orWhere('EXISTS (select 1 from user_chat uc2 inner join "user" u on uc2.userId = u.id where uc2.chatId = chat.id and LOWER(u.username) ILIKE :search)', { search: `%${search}%` });
                }));
            }

            qb.addSelect(sub => {
                return sub
                    .select('COUNT(uc2.id)')
                    .from(UserChatEntity, 'uc2')
                    .where('uc2.chatId = chat.id');
            }, 'participantsCount');

            // add lastMessageAt: either the latest message createdAt or fallback to chat.updatedAt
            qb.addSelect(
                `COALESCE((select MAX(m."createdAt") from message_chat m where m."chatId" = "chat"."id"), "chat"."updatedAt")`,
                'lastMessageAt',
            );

            if (cursor) {
                if (orderBy === 'chatName') {
                    const [cursorName, cursorIdRaw] = String(cursor).split('_');
                    const cursorId = Number(cursorIdRaw) || 0;
                    if (order === 'ASC') {
                        qb.andWhere(new Brackets(b => {
                            b.where('chat.chatName > :cName', { cName: cursorName })
                             .orWhere('chat.chatName = :cName AND chat.id > :cId', { cName: cursorName, cId: cursorId });
                        }));
                    } else {
                        qb.andWhere(new Brackets(b => {
                            b.where('chat.chatName < :cName', { cName: cursorName })
                             .orWhere('chat.chatName = :cName AND chat.id < :cId', { cName: cursorName, cId: cursorId });
                        }));
                    }
                } else {
                    const [iso, idRaw] = String(cursor).split('_');
                    const cursorDate = new Date(iso);
                    const cursorId = Number(idRaw) || 0;
                    if (!isNaN(cursorDate.getTime())) {
                        if (order === 'ASC') {
                            qb.andWhere(new Brackets(b => {
                                b.where('chat.updatedAt > :cDate', { cDate: cursorDate.toISOString() })
                                 .orWhere('chat.updatedAt = :cDate AND chat.id > :cId', { cDate: cursorDate.toISOString(), cId: cursorId });
                            }));
                        } else {
                            qb.andWhere(new Brackets(b => {
                                b.where('chat.updatedAt < :cDate', { cDate: cursorDate.toISOString() })
                                 .orWhere('chat.updatedAt = :cDate AND chat.id < :cId', { cDate: cursorDate.toISOString(), cId: cursorId });
                            }));
                        }
                    }
                }
            }

            if (orderBy === 'chatName') {
                qb.orderBy('chat.chatName', order as any).addOrderBy('chat.id', order as any);
            } else {
                qb.orderBy('chat.updatedAt', order as any).addOrderBy('chat.id', order as any);
            }

            qb.take(limit + 1);

            const result = await qb.getRawAndEntities();

            const raws = result.raw;
            const entities = result.entities;

            if (!entities || entities.length === 0) {
                return { items: [], nextCursor: undefined };
            }

            let nextCursor: string | undefined = undefined;
            if (entities.length > limit) {
                const lastEntity = entities[limit - 1];
                const lastRaw = raws[limit - 1];
                if (orderBy === 'chatName') {
                    const name = lastEntity.chat?.chatName || '';
                    nextCursor = `${name}_${lastEntity.chat?.id}`;
                } else {
                    const lastTime = lastRaw && (lastRaw.lastMessageAt || lastRaw.coalesce) ? (lastRaw.lastMessageAt || lastRaw.coalesce) : (lastEntity.chat?.updatedAt ? new Date(lastEntity.chat.updatedAt).toISOString() : '');
                    nextCursor = `${new Date(lastTime).toISOString()}_${lastEntity.chat?.id}`;
                }
            }

            const limited = entities.slice(0, limit);

            const items = limited.map((uc, i) => {
                const raw = raws[i] || {};
                return {
                    id: uc.id,
                    admin: uc.admin,
                    donator: uc.donator,
                    chat: uc.chat ? {
                        id: uc.chat.id,
                        chatName: uc.chat.chatName,
                        createdAt: uc.chat.createdAt,
                        updatedAt: uc.chat.updatedAt,
                    } : null,
                    chatStatus: uc.chat?.chatStatus ? { id: uc.chat.chatStatus.id } : null,
                    donationId: uc.chat?.donation?.id || null,
                    participantsCount: Number(raw.participantsCount || 0),
                    lastMessageAt: raw.lastMessageAt || null,
                };
            });

            return { items, nextCursor };
        } catch (error) {
            throw error;
        }
    }
}