import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TagsEntity } from './entity/tags.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(TagsEntity)
        private readonly tagsRepository: Repository<TagsEntity>,
    ) { }

    async createTag(tag: string): Promise<TagsEntity> {
        try {
            if (!tag) throw new BadRequestException('Tag necesaria');
            tag=tag.trim().toLowerCase();
            const exist = await this.tagsRepository.findOne({ where: { tag: tag } });
            if (exist) throw new BadRequestException('Tag ya existe');
            const newTag = this.tagsRepository.create({ tag: tag });
            return await this.tagsRepository.save(newTag);
        } catch (error) {
            throw error;
        }
    }

    async getAllTags(): Promise<TagsEntity[]> {
        try {
            const tags = await this.tagsRepository.find();
            if (!tags.length) throw new BadRequestException('No hay tags');
            return tags;
        } catch (error) {
            throw error;
        }
    }

    async getTabByName(tag: string): Promise<TagsEntity> {
        try {
            if (!tag) throw new BadRequestException('Tag necesaria');
            tag=tag.trim().toLowerCase();
            const tagEntity = await this.tagsRepository.findOne({ where: { tag: tag } });
            if (!tagEntity) throw new BadRequestException('Tag no encontrada');
            return tagEntity;
        } catch (error) {
            throw error;
        }
    }

    async getTagById(id: number): Promise<TagsEntity> {
        try {
            if (!id) throw new BadRequestException('ID necesaria');
            const tagEntity = await this.tagsRepository.findOne({ where: { id: id } });
            if (!tagEntity) throw new BadRequestException('Tag no encontrada');
            return tagEntity;
        } catch (error) {
            throw error;
        }
    }

    async updateTag(id: number, tag?: string): Promise<TagsEntity> {
        try {
            if(!id) throw new BadRequestException('id necesario');
            if(!tag) throw new BadRequestException('tag necesario');
            tag=tag.trim().toLowerCase();
            const tagEntity = await this.getTagById(id);
            if(!tagEntity) throw new NotFoundException('tag no encontrada');
            tagEntity.tag = tag;
            return await this.tagsRepository.save(tagEntity);
        } catch (error) {
            throw error;
        }
    }

    async deletetag(id:number):Promise<any>{
        try {
            if(!id) throw new BadRequestException('id necesario');
            const tag= await this.getTagById(id);
            if(!tag) throw new NotFoundException('tag no encontrada');
            await this.tagsRepository.delete(id);
            return {message:'tag eliminada'};
        } catch (error) {
            throw error;
        }
    }
}
