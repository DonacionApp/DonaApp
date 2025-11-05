import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusSupportIdEntity } from './entity/status.supportid.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatussupportidService {
    constructor(
        @InjectRepository(StatusSupportIdEntity)
        private readonly statusSupportIdRepository: Repository<StatusSupportIdEntity>,
    ){}

    async getAllStatusSupportId():Promise<StatusSupportIdEntity[]>{
        try {
            const status= await this.statusSupportIdRepository.find();
            if(!status || status.length===0){
                throw new NotFoundException('No se encontraron estados de soporte de identificación');
            }
            return status;
        } catch (error) {
            throw error;
        }
    }

    async getStatusSupportIdById(id:number):Promise<StatusSupportIdEntity>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('El id proporcionado no es válido');
            }
            const status= await this.statusSupportIdRepository.findOneBy({id});
            if(!status){
                throw new NotFoundException(`No se encontró el estado de soporte de identificación con id ${id}`);
            }
            return status;
        } catch (error) {
            throw error;
        }
    }
}
