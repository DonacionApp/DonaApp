import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypePostEntity } from './entity/type.port.entity';
import { Not, Repository } from 'typeorm';

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
    
    async findByName(name:string):Promise<TypePostEntity>{
        try {
            const type = await this.typePostRespository.findOne({ where: { type:name } });
            if (!type) {
                throw new NotFoundException('no se encontró el tipo de post')
            }
            return type;
        } catch (error) {
            throw error;
        }
    }

    async create(typePost:string):Promise<TypePostEntity>{
        try {
            if(!typePost){
                throw new BadRequestException('el tipo de post es requerido');
            }
            console.log(typePost)
            typePost=(typePost.trim()).toLowerCase();
            const exists= await this.typePostRespository.findOne({where:{type:typePost}});
            if(exists){
                throw new BadRequestException('el tipo de post ya existe');
            }
            const newTypePost = this.typePostRespository.create({ type: typePost });
            return await this.typePostRespository.save(newTypePost);
        } catch (error) {
            throw error;
        }
    }

    async update(id:number,typePost:string):Promise<TypePostEntity>{
        try {
            if(!typePost){
                throw new BadRequestException('el tipo de post es requerido');
            }
            if(!id){
                throw new BadRequestException('el id es requerido');
            }
            typePost=typePost.trim().toLowerCase();
            const exists= await this.typePostRespository.findOne({where:{type:typePost, id:Not(id)}});
            if(exists){
                throw new BadRequestException('el tipo de post ya existe');
            }
            const typeToUpdate= await this.findById(id);
            typeToUpdate.type=typePost;
            return await this.typePostRespository.save(typeToUpdate);
        } catch (error) {
            throw error;
        }
    }

    async delete(id:number):Promise<any>{
        try {
            if(!id){
                throw new BadRequestException('el id es requerido');
            }
            const exists= await this.findById(id);
            if(!exists){
                throw new NotFoundException('no se encontró el tipo de post');
            }
            await this.typePostRespository.delete(id);
            return {message:'tipo de post eliminado correctamente',status:200};
        } catch (error) {
            throw error;
        }
    }

}
