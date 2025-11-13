import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatStatusEntity } from './entity/chat.status.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChatstatusService {
    constructor(
        @InjectRepository(ChatStatusEntity)
        private readonly chatStatusRepository: Repository<ChatStatusEntity>,
    ){}

    async getAllStatus(): Promise<ChatStatusEntity[] | {mesage:string, status:number}> {
        try {
            const statuses = await this.chatStatusRepository.find();
            if(!statuses || statuses.length === 0){
                return {mesage: 'No se encontraron estados de chat', status: 404} as any;
            }
            return statuses;
        } catch (error) {
            throw error;
        }
    }
    async getStatusByType(type: string): Promise<ChatStatusEntity | {mesage:string, status:number}> {
        try {
            if(!type){
                return {mesage: 'El tipo de estado de chat es requerido', status: 400} as any;
            }
            const status = await this.chatStatusRepository.findOne({ where: { status: type } });
            if(!status){
                return {mesage: 'Estado de chat no encontrado', status: 404} as any;
            }
            return status;
        } catch (error) {
            throw error;
        }
    }

    async getStatusById(id: number): Promise<ChatStatusEntity | {mesage:string, status:number}> {
        try {
            if(!id || id <=0){
                return {mesage: 'El ID de estado de chat es inválido', status: 400} as any;
            }
            const status = await this.chatStatusRepository.findOne({ where: { id } });
            if(!status){
                return {mesage: 'Estado de chat no encontrado', status: 404} as any;
            }
            return status;
        } catch (error) {
            throw error;
        }
    }
}