import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypePostEntity } from './entity/type.port.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypepostService {
    constructor(
        @InjectRepository(TypePostEntity)
        private readonly typePostRespository: Repository<TypePostEntity>,
    ){}

    async findAll():Promise<TypePostEntity[]>{
        try {
            const types= await this.typePostRespository.find();
            if(!types){
                throw new NotFoundException('no se encontraron los tipos de post')
            }
            return types;
        } catch (error) {
            throw error;
        }
    }

    async findById(id:number):Promise<TypePostEntity>{
        try {
            const type = await this.typePostRespository.findOne({ where: { id } });
            if (!type) {
                throw new NotFoundException('no se encontró el tipo de post')
            }
            return type;
        } catch (error) {
            throw error;
        }
    }
}
