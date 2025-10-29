import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypePostEntity } from './entity/type.port.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypepostService {
    constructor(
        @InjectRepository(TypePostEntity)
        private readonly typePostRespository: Repository<TypePostEntity>,
    ){}
}
