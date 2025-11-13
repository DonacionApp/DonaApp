import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportEntity } from './entity/report.entity';
import { Repository, Brackets } from 'typeorm';
import { CreateReportDto } from './dto/create.report.dto';
import { TypeNotifyService } from '../typenotify/typenotify.service';
import { UserService } from '../user/user.service';
import { TypereportService } from '../typeReport/typereport.service';
import { NotifyService } from '../notify/notify.service';
import { ConfigService } from '@nestjs/config';
import { URL_FRONTEND } from 'src/config/constants';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(ReportEntity)
        private readonly reportRepository: Repository<ReportEntity>,
        private readonly typeReportService: TypereportService,
        @Inject(forwardRef(() => TypeNotifyService))
        private readonly typeNotifyService: TypeNotifyService,
        @Inject(forwardRef(() => NotifyService))
        private readonly notifyService: NotifyService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ){}

    async createReport(reportData:CreateReportDto, currenUser:number):Promise<{message:string, status:number}> {
        try {
            if(!reportData || !reportData.idUser || !reportData.content  || !reportData.content.report){
                return {message: 'Datos incompletos para realizar el reporte', status: 400};
            }
            if(reportData.idUser === currenUser){
                return {message: 'No puedes reportarte a ti mismo', status: 400};
            }
            const reportedUser= await this.userService.findById(Number(reportData.idUser));
            if(!reportedUser){
                return {message: 'El usuario a reportar no existe', status: 404};
            }
            if(reportData.content.postReport && reportData.content.postReport <=0){
                return {message: 'ID de publicación inválido', status: 400};
            }
            const comments= JSON.stringify(reportData.content);
            let typeRportOriginal;
            if(reportData.content.postReport && reportData.content.postReport >0){
                typeRportOriginal= await this.typeReportService.getTypeReportByType('publicacion');
            }else{
                typeRportOriginal= await this.typeReportService.getTypeReportByType('user');
            }
            if(!typeRportOriginal || (typeRportOriginal as any).status === 404){
                return {message: 'Tipo de reporte no encontrado', status: 404};
            }
            const newReport= this.reportRepository.create({
                user: {id: reportedUser.id},
                comments:comments,
                typeReport: {id: typeRportOriginal.id},
            });
            await this.reportRepository.save(newReport);
            const typeNotify=await this.typeNotifyService.getByType('alerta');
            if(typeNotify && (typeNotify as any).status !== 404){
                const urlFront = this.configService.get<string>(URL_FRONTEND) || '';
                let notifyTitle = 'Nuevo reporte';
                let notifyMessage = `Se ha recibido un reporte.`;
                let notifyLink: string | null = null;

                const postReportId = reportData.content?.postReport ? Number(reportData.content.postReport) : null;
                if (postReportId && postReportId > 0) {
                    notifyTitle = 'Reporte de publicación';
                    notifyMessage = `Se ha reportado la publicación con id ${postReportId}.`;
                    notifyLink = `${urlFront}/post/${postReportId}`;
                } else {
                    notifyTitle = 'Reporte de usuario';
                    notifyMessage = `Se ha reportado al usuario ${reportedUser.username || reportedUser.id}.`;
                    notifyLink = `${urlFront}/profile/${reportedUser.id}`;
                }

                const typeNotifyId = (typeNotify as any).id || 1;
                await this.notifyService.createNotifyForAdmins({
                    title: notifyTitle,
                    message: notifyMessage,
                    link: notifyLink,
                    typeNotifyId: typeNotifyId,
                });
            }
            return {message: 'Reporte realizado con éxito', status: 201};
        } catch (error) {
            throw error;
        }
    }

    async getReports(options?: any):Promise<{ items: any[]; nextCursor?: string }> {
        try {
            const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
            const cursor = options?.cursor ? String(options.cursor) : null;
            const search = options?.search ? String(options.search).toLowerCase() : null;
            const orderBy = options?.orderBy === 'username' ? 'username' : 'createdAt';
            const order = (String(options?.order || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

            const qb = this.reportRepository.createQueryBuilder('report')
                .leftJoinAndSelect('report.user', 'user')
                .leftJoinAndSelect('user.people', 'people');

            if (search && search.trim().length > 0) {
                qb.andWhere('LOWER(user.username) ILIKE :search', { search: `%${search}%` });
            }

            if (cursor) {
                if (orderBy === 'username') {
                    const [cursorUsername, cursorIdRaw] = String(cursor).split('_');
                    const cursorId = Number(cursorIdRaw) || 0;
                    if (order === 'ASC') {
                        qb.andWhere(new Brackets(b => {
                            b.where('user.username > :cUser', { cUser: cursorUsername })
                             .orWhere('user.username = :cUser AND report.id > :cId', { cUser: cursorUsername, cId: cursorId });
                        }));
                    } else {
                        qb.andWhere(new Brackets(b => {
                            b.where('user.username < :cUser', { cUser: cursorUsername })
                             .orWhere('user.username = :cUser AND report.id < :cId', { cUser: cursorUsername, cId: cursorId });
                        }));
                    }
                } else {
                    const [iso, idRaw] = String(cursor).split('_');
                    const cursorDate = new Date(iso);
                    const cursorId = Number(idRaw) || 0;
                    if (!isNaN(cursorDate.getTime())) {
                        if (order === 'ASC') {
                            qb.andWhere(new Brackets(b => {
                                b.where('report.createdAt > :cDate', { cDate: cursorDate.toISOString() })
                                 .orWhere('report.createdAt = :cDate AND report.id > :cId', { cDate: cursorDate.toISOString(), cId: cursorId });
                            }));
                        } else {
                            qb.andWhere(new Brackets(b => {
                                b.where('report.createdAt < :cDate', { cDate: cursorDate.toISOString() })
                                 .orWhere('report.createdAt = :cDate AND report.id < :cId', { cDate: cursorDate.toISOString(), cId: cursorId });
                            }));
                        }
                    }
                }
            }

            if (orderBy === 'username') {
                qb.orderBy('user.username', order as any).addOrderBy('report.id', order as any);
            } else {
                qb.orderBy('report.createdAt', order as any).addOrderBy('report.id', order as any);
            }

            qb.take(limit + 1); 

            const rows = await qb.getMany();

            let nextCursor: string | undefined = undefined;
            let items = rows;
            if (rows.length > limit) {
                const last = rows[limit - 1];
                if (orderBy === 'username') {
                    const uname = (last.user && last.user.username) ? String(last.user.username) : '';
                    nextCursor = `${uname}_${last.id}`;
                } else {
                    const created = last.createdAt ? new Date(last.createdAt).toISOString() : '';
                    nextCursor = `${created}_${last.id}`;
                }
                items = rows.slice(0, limit);
            }

            const mapped = items.map((r: any) => ({
                id: r.id,
                comments: (r.comments) ? JSON.parse(r.comments) : null,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                user: r.user ? { id: r.user.id, username: r.user.username, profilePhoto: r.user.profilePhoto } : null,
            }));

            return { items: mapped, nextCursor };
        } catch (error) {
            throw error;
        }
    }

}
