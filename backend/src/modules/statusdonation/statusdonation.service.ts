import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusDonationEntity } from './entity/status.donation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatusdonationService {
    constructor(
        @InjectRepository(StatusDonationEntity)
        private readonly statusDonationRepository: Repository<StatusDonationEntity>,
    ){}

    async findAll():Promise<StatusDonationEntity[]>{
        try {
            const status= await this.statusDonationRepository.find();
            if(!status || status.length===0){
                throw new NotFoundException('No se encontraron estados de donación');
            }
            return status;
        } catch (error) {
            throw error;
        }
    }

    async findById(id:number):Promise<StatusDonationEntity>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new NotFoundException('El id proporcionado no es válido');
            }
            const status= await this.statusDonationRepository.findOne({where:{id}});
            if(!status){
                throw new NotFoundException('No se encontró el estado de donación con el id proporcionado');
            }
            return status;
        } catch (error) {
            throw error;
        }
    }

    async findByname(name:string):Promise<StatusDonationEntity>{
        try {
            if(!name || name.trim()===''){
                throw new NotFoundException('El nombre proporcionado no es válido');
            }
            const status= await this.statusDonationRepository.findOne({where:{status:name}});
            if(!status){
                throw new NotFoundException('No se encontró el estado de donación con el nombre proporcionado');
            }

            return status;
        } catch (error) {
            throw error;
        }
    }
}
