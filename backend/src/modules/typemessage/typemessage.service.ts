import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeMessageEntity } from './entity/type.message.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypemessageService {
    constructor(
        @InjectRepository(TypeMessageEntity)
        private readonly typeMessageRepository: Repository<TypeMessageEntity>,
    ){}
    
    async getAllTypesMessages(): Promise<TypeMessageEntity[]> {
        try {
            const typesMessages = await this.typeMessageRepository.find();
            if(!typesMessages || typesMessages.length === 0){
                return {message: 'No hay tipos de mensajes disponibles', status: 404} as any;
            }
            return typesMessages;
        } catch (error) {
            throw error;
        }
    }

    async getTypeMessageByType(type: string): Promise<TypeMessageEntity | {message:string, status:number}> {
        try {
            if(!type){
                return {message: 'Tipo de mensaje es requerido', status: 400};
            }
            const typemessage= await this.typeMessageRepository.createQueryBuilder('tm')
                .where('tm.type = :type', {type})
                .getOne();
            if(!typemessage){
                return {message: 'Tipo de mensaje no encontrado', status: 404};
            }
            return typemessage;
        } catch (error) {
            throw error;
        }
    }

    async getTypeByType(type: string): Promise<TypeMessageEntity | {message:string, status:number}> {
        try {
            if(!type){
                return {message: 'Tipo de mensaje es requerido', status: 400};
            }
            const typemessage= await this.typeMessageRepository.createQueryBuilder('tm')
                .where('tm.type = :type', {type})
                .getOne();
            if(!typemessage){
                return {message: 'Tipo de mensaje no encontrado', status: 404};
            }
            return typemessage;
        } catch (error) {
            throw error;
        }
    }
}