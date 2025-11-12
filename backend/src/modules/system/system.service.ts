import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { systemEntity } from './entity/system.entity';
import { Repository } from 'typeorm';
import { NotifyService } from '../notify/notify.service';
import { TypeNotifyService } from '../typenotify/typenotify.service';
import { CreateNotifyDto } from '../notify/dto/create.notify.dto';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(systemEntity)
        private readonly systemRepository: Repository<systemEntity>,
        @Inject(forwardRef(()=>NotifyService))
        private readonly notifyService: NotifyService,
        private readonly typeNotifyService: TypeNotifyService
    ) { }
    
    async getTermsAndPolicies(): Promise<systemEntity> {
        try {
            const system = await this.systemRepository.findOneBy({id:1});
            if(!system){
                const newSystem= this.systemRepository.create({});
                return await this.systemRepository.save(newSystem);
            }
            return system;
        } catch (error) {
            throw error;
        }
    }

    async getSystemPolicies(): Promise<systemEntity[]> {
        try {
            const policies = await this.systemRepository.createQueryBuilder('system')
                .addSelect(['system.privacyPolicy']).getMany()
                const policiUnique={policies: policies[0].privacyPolicy};
            return policiUnique as any;
        } catch (error) {
            throw error;
        }

    }

    async getSystemTerms(): Promise<systemEntity[]> {
        try {
            const terms = await this.systemRepository.createQueryBuilder('system')
                .addSelect(['system.termsAndConditions']).getMany()
                const termsUnique= {terms: terms[0].termsAndConditions};
            return termsUnique as any;

        } catch (error) {
            throw error;
        }
    }

    async getSystemAboutUs(): Promise<systemEntity[]> {
        try {
            
        const aboutUs = await this.systemRepository.createQueryBuilder('system')
            .addSelect(['system.aboutUs']).getMany()
            const aboutUsUnique= {aboutUs: aboutUs[0].aboutUs};
        return aboutUsUnique as any;
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
            console.log('content :', policies)
            system.privacyPolicy= policies;
            const sytemPolicie= await this.systemRepository.save(system);
            const updatedPolicie= {policies: sytemPolicie.privacyPolicy};

            const typeNotify = await this.typeNotifyService.getByType('informaacion');
            const notifyDto = new CreateNotifyDto();
            notifyDto.title = 'Actualización de Políticas de Privacidad';
            notifyDto.message = 'Se han actualizado las Políticas de Privacidad.';
            notifyDto.typeNotifyId = typeNotify.id;
            notifyDto.link= '/policies'
            await this.notifyService.createNotifyForAllUsers(notifyDto);
            return updatedPolicie as any;
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
            const systemTerms= await this.systemRepository.save(system);
            const updatedTerms= {terms: systemTerms.termsAndConditions};
            const typeNotify = await this.typeNotifyService.getByType('informaacion');
            const notifyDto = new CreateNotifyDto();
            notifyDto.title = 'Actualización de Términos y Condiciones';
            notifyDto.message = 'Se han actualizado los Términos y Condiciones.';
            notifyDto.typeNotifyId = typeNotify.id;
            notifyDto.link= '/terms'
            await this.notifyService.createNotifyForAllUsers(notifyDto);
            return updatedTerms as any;
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
            const systemAboutUs= await this.systemRepository.save(system);
            const updatedAboutUs= {aboutUs: systemAboutUs.aboutUs};
            const typeNotify = await this.typeNotifyService.getByType('informaacion');
            const notifyDto = new CreateNotifyDto();
            notifyDto.title = 'Actualización Sobre Nosotros';
            notifyDto.message = 'Se ha actualizado la sección Sobre Nosotros.';
            notifyDto.typeNotifyId = typeNotify.id;
            notifyDto.link= '/about-us'
            await this.notifyService.createNotifyForAllUsers(notifyDto);
            return updatedAboutUs as any;
        } catch (error) {
            throw error;
        }
    }
}