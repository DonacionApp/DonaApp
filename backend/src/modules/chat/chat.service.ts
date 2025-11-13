import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from './entity/chat.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatEntity)
        private readonly chatRepository: Repository<ChatEntity>,
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
}
