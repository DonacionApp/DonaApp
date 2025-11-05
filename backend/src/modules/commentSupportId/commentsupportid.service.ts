import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentSupportIdEntity } from './entity/comment.supportid.entity';
import { Repository } from 'typeorm';
import { StatussupportidService } from '../statussupportid/statussupportid.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CommentsupportidService {
    constructor(
        @InjectRepository(CommentSupportIdEntity)
        private readonly commentSupportIdRepository: Repository<CommentSupportIdEntity>,
        private readonly statusSupportIdService: StatussupportidService,
        private readonly  userService: UserService,
    ){}
}
