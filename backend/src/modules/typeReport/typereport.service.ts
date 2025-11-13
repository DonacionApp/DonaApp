import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeReportEntity } from './entity/type.report.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypereportService {
    constructor(
        @InjectRepository(TypeReportEntity)
        private readonly typeReportRepository: Repository<TypeReportEntity>,
    ){}
    async getAllTypeReports(): Promise<TypeReportEntity[]| {message:string, status:number}> {
        try {
        const typeReports = await this.typeReportRepository.find();
        if(typeReports.length === 0){
            return {message: 'No hay tipos de reportes disponibles', status: 404};
        }
        return typeReports;
        } catch (error) {
            throw error;
        }
    }

    async getTypeReportById(id:number): Promise<TypeReportEntity | null>{
        try {
            if(!id || id <=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('ID inválido');
            }
            const typeReport= await this.typeReportRepository.createQueryBuilder('typeReport')
            .where('typeReport.id = :id', {id})
            .getOne();
            return typeReport || {message: 'Tipo de reporte no encontrado', status: 404} as any;
        } catch (error) {
            throw error;
        }
    }

    async getTypeReportByType(type:string): Promise<TypeReportEntity | null>{
        try {
            if(!type || type.trim() === ''){
                throw new BadRequestException('Tipo inválido');
            }
            const typeReport= await this.typeReportRepository.createQueryBuilder('typeReport')
            .where('typeReport.type = :type', {type})
            .getOne();
            return typeReport || {message: 'Tipo de reporte no encontrado', status: 404} as any;
        } catch (error) {
            throw error;
        }
    }
}