import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { systemEntity } from './entity/system.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(systemEntity)
        private readonly systemRepository: Repository<systemEntity>,
    ) { }

    async getSystemPolicies(): Promise<systemEntity[]> {
        try {
            const policies = await this.systemRepository.createQueryBuilder('system')
                .addSelect(['system.politicasDePrivacidad']).getMany()
            return policies;
        } catch (error) {
            throw error;
        }

    }

    async getSystemTerms(): Promise<systemEntity[]> {
        try {
            const terms = await this.systemRepository.createQueryBuilder('system')
                .addSelect(['system.terminosYCondiciones']).getMany()
            return terms;

        } catch (error) {
            throw error;
        }
    }

    async getSystemAboutUs(): Promise<systemEntity[]> {
        try {
            
        const aboutUs = await this.systemRepository.createQueryBuilder('system')
            .addSelect(['system.aboutUs']).getMany()
        return aboutUs;
        } catch (error) {
            throw error;
        }
    }

    async updateSystemPolicies(policies: string): Promise<systemEntity> {
        try {
            const system= await this.systemRepository.findOneBy({id:1});
            if(!system){
                const newSystem= this.systemRepository.create({privacyPolicy: policies});
                return await this.systemRepository.save(newSystem);
            }
            system.privacyPolicy= policies;
            return await this.systemRepository.save(system);
        } catch (error) {
            throw error;
        }
    }

    async updateSystemTerms(terms: string): Promise<systemEntity> {
        try {
            const system= await this.systemRepository.findOneBy({id:1});
            if(!system){
                const newSystem= this.systemRepository.create({termsAndConditions: terms});
                return await this.systemRepository.save(newSystem);
            }
            system.termsAndConditions= terms;
            return await this.systemRepository.save(system);
        } catch (error) {
            throw error;
        }
    }

    async updateSystemAboutUs(aboutUs: string): Promise<systemEntity> {
        try {
            const system= await this.systemRepository.findOneBy({id:1});
            if(!system){
                const newSystem= this.systemRepository.create({aboutUs: aboutUs});
                return await this.systemRepository.save(newSystem);
            }
            system.aboutUs= aboutUs;
            return await this.systemRepository.save(system);
        } catch (error) {
            throw error;
        }
    }
}