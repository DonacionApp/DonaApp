import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TagsEntity } from './entity/tags.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(TagsEntity)
        private readonly tagsRepository: Repository<TagsEntity>,
    ){}
}
