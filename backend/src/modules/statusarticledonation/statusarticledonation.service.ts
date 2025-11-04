import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusPostDonationArticle } from './entity/status.postdonationarticle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatusarticledonationService {
    constructor(
        @InjectRepository(StatusPostDonationArticle)
        private readonly statusPostDonationArticleRepository: Repository<StatusPostDonationArticle>
    ) { }

    async findAll(): Promise<StatusPostDonationArticle[]> {
        try {
            const statuses = await this.statusPostDonationArticleRepository.find();
            if (!statuses || statuses.length <= 0) {
                throw new Error('no hay estados de articulos de donacion registrados')
            }
            return statuses;
        } catch (error) {
            throw error;
        }
    }

    async getSatausById(id: number): Promise<StatusPostDonationArticle> {
        try {
            if (!id || id <= 0 || isNaN(id) || id === undefined) {
                throw new BadRequestException('estado invalido')
            }
            const status = await this.statusPostDonationArticleRepository.findOneBy({ id: id });
            if (!status) {
                throw new NotFoundException('el estado no existe')
            }
            return status;
        } catch (error) {
            throw error;
        }
    }

    async getStatusByName(name: string): Promise<StatusPostDonationArticle> {
        try {
            if (!name || name.trim().length <= 0) {
                throw new BadRequestException('nombre de estado invalido')
            }
            const status = await this.statusPostDonationArticleRepository.findOne({
                where: {
                    status: name
                }
            });
            if (!status) {
                throw new NotFoundException('el estado no existe')
            }
            return status;
        } catch (error) {
            throw error;
        }
    }

    async createStatus(name: string): Promise<StatusPostDonationArticle> {
        try {
            if (!name || name.trim().length <= 0) {
                throw new BadRequestException('nombre de estado invalido')
            }
            const existingStatus = await this.statusPostDonationArticleRepository.findOne({
                where: {
                    status: name
                }
            });
            if (existingStatus) {
                throw new BadRequestException('el estado ya existe')
            }
            const newStatus = this.statusPostDonationArticleRepository.create({
                status: name
            });
            return await this.statusPostDonationArticleRepository.save(newStatus);
        } catch (error) {
            throw error;
        }
    }

    async deleteStatus(id: number): Promise<{ message: string, status: number }> {
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('estado invalido')
            }
            const status = await this.statusPostDonationArticleRepository.findOneBy({ id: id });
            if (!status) {
                throw new NotFoundException('el estado no existe')
            }
            await this.statusPostDonationArticleRepository.remove(status);
            return { message: 'estado eliminado', status: id };
        } catch (error) {
            throw error;
        }
    }
}
