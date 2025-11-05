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

    async getStatusSupportIdByName(name:string):Promise<StatusSupportIdEntity>{
        try {
            if(!name || name.trim().length===0){
                throw new BadRequestException('El nombre del estado de soporte de identificación no puede estar vacío');
            }
            name=name.trim().toLowerCase();
            const status= await this.statusSupportIdRepository.findOne({
                where:{
                    name:name
                }
            });
            if(!status){
                throw new NotFoundException(`No se encontró el estado de soporte de identificación con nombre ${name}`);
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

    async createStatusSupportId(name:string):Promise<StatusSupportIdEntity>{
        try {
            if(!name || name.trim().length===0){
                throw new BadRequestException('El nombre del estado de soporte de identificación no puede estar vacío');
            }
            name=name.trim().toLowerCase();
            const existStatus= await this.statusSupportIdRepository.findOne({
                where:{
                    name:name
                }
            });
            if(existStatus){
                throw new BadRequestException(`El estado de soporte de identificación con nombre ${name} ya existe`);
            }
            const newStatus= this.statusSupportIdRepository.create({name:name.trim()});
            return await this.statusSupportIdRepository.save(newStatus);
        } catch (error) {
            throw error;
        }
    }

    async deleteStatusSupportId(id:number):Promise<{message:string, status:number}>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('El id proporcionado no es válido');
            }
            const status= await this.statusSupportIdRepository.findOneBy({id});
            if(!status){
                throw new NotFoundException(`No se encontró el estado de soporte de identificación con id ${id}`);
            }
            await this.statusSupportIdRepository.delete(id);
            return {message:`El estado de soporte de identificación con id ${id} ha sido eliminado exitosamente`, status:200};
        } catch (error) {
            throw error;
        }
    }

}
