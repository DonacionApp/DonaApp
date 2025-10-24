import { BadRequestException, Injectable, NotFoundException, Type } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeDniEntity } from './entity/type.dni.entity';
import { Repository } from 'typeorm';
import { CreatetypeDniDto } from './dto/create.type.dni.dto';

@Injectable()
export class TypedniService {
    constructor(
        @InjectRepository(TypeDniEntity)
        private readonly typeDniRepository: Repository<TypeDniEntity>,
    ){}

    async fyndAll():Promise<TypeDniEntity[]>{
        try {
            const typeDni= await this.typeDniRepository.find();
            if(!typeDni || typeDni.length===0){
                throw new BadRequestException('No hay tipos de DNI registrados');
            }
            return typeDni;
        } catch (error) {
            throw error;
        }
    }

    async fyndById(idType:number):Promise<TypeDniEntity>{
        try {
            idType= Number(idType);
            const typeDni= await this.typeDniRepository.findOne({
                where:{
                    id:idType
                }
            });
            if(!typeDni){
                throw new NotFoundException('Tipo de DNI no encontrado');
            } 
            return typeDni;     
        } catch (error) {
            throw error;
        }
    }

    async fyndByname(typeDni:string):Promise<TypeDniEntity>{
        try {
            typeDni= (typeDni.toUpperCase()).trim();
            const typeDniFound = await this.typeDniRepository.findOne({
                where:{
                    type: typeDni
                }
            });
            if(!typeDniFound){
                throw new NotFoundException('Tipo de DNI no encontrado');
            };   
            return  typeDniFound;    
        } catch (error) {
            throw error;
        }
    }

    async create( dto: CreatetypeDniDto):Promise<TypeDniEntity>{
        try {
            if(!dto.type){
                throw new BadRequestException('El tipo de DNI es obligatorio');
            }
            dto.type= (dto.type.toUpperCase()).trim();
            const typeDniExists= await this.typeDniRepository.findOne({
                where:{
                    type:dto.type
                }
            });
            if(typeDniExists){
                throw new BadRequestException('El tipo de DNI ya existe');
            }
            const newTypeDni= this.typeDniRepository.create(dto);
            return await this.typeDniRepository.save(newTypeDni);
        } catch (error) {
            throw error;
        }
    };

    async update(idType:number, dto: CreatetypeDniDto){
        try {
            if(!idType){
                throw new BadRequestException('El id del tipo de DNI es obligatorio');
            }
            dto.type= (dto.type.toUpperCase()).trim();
            const typeDniExists= await this.fyndById(idType);
            if(!typeDniExists){
                throw new NotFoundException('Tipo de DNI no encontrado');
            }
            if(dto.type=== typeDniExists.type){
                throw new BadRequestException('No se realizaron cambios en el tipo de DNI');
            }
            const typeDniNameExist = await this.typeDniRepository.findOne({
                where:{
                    type:dto.type
                }
            });
            if(typeDniNameExist){
                throw new BadRequestException('El tipo de DNI ya existe');
            }
            typeDniExists.type = dto.type;
            return await this.typeDniRepository.save(typeDniExists);
            
        } catch (error) {
            throw error;
        }
    }

    async delete(idType:number):Promise<any>{
        try {
            if(!idType){
                throw new BadRequestException('El id del tipo de DNI es obligatorio');
            };
            const typeDniExists=await this.fyndById(idType);
            if(!typeDniExists){
                throw new NotFoundException('Tipo de DNI no encontrado');
            }
            await this.typeDniRepository.delete(idType);
            return {message: 'Tipo de DNI eliminado correctamente'};
        } catch (error) {
            throw error;
        }
    }
}
