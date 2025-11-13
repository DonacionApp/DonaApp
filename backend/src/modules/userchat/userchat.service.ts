import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserChatEntity } from './entity/user.chat.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserchatService {
    constructor(
        @InjectRepository(UserChatEntity)
        private readonly userChatRepository: Repository<UserChatEntity>,
        
    ){}
}
