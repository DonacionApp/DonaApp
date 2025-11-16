import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationReviewEntity } from './entity/donation.review.entity';
import { Repository } from 'typeorm';
import { DonationService } from '../donation/donation.service';
import { DonationEntity } from 'src/modules/donation/entity/donation.entity';
import { ConfigService } from '@nestjs/config';
import { CreateReviewDto } from './dto/create.review.dto';
import { SentimentServiceService } from 'src/core/sentiment-service/sentiment-service.service';
import { retry } from 'rxjs';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DonationreviewService {
    constructor(
        @InjectRepository(DonationReviewEntity)
        private readonly donationReviewRepository: Repository<DonationReviewEntity>,
        private readonly donationService:DonationService,
        private readonly configService: ConfigService,
        private readonly sentimentService: SentimentServiceService,
        @Inject(forwardRef(() => AuditService))
        private readonly auditService: AuditService,
    ){}

    async createReview(currentUserId:number, dto:CreateReviewDto):Promise<DonationReviewEntity>{
        try {
            if(!currentUserId || currentUserId<=0 || isNaN(currentUserId) || currentUserId===undefined){
                throw new BadRequestException('usuario invalido')
            }
            const {review, donationId} = dto;
            if(!donationId || donationId<=0 || isNaN(donationId) || donationId===undefined){
                throw new BadRequestException('donacion invalida')
            }
            const donation = await this.donationReviewRepository.manager
                .createQueryBuilder(DonationEntity, 'donation')
                .leftJoinAndSelect('donation.post', 'post')
                .leftJoinAndSelect('post.typePost', 'typePost')
                .leftJoinAndSelect('post.user', 'postUser')
                .leftJoinAndSelect('donation.user', 'donationUser')
                .where('donation.id = :id', { id: donationId })
                .getOne();

            if (!donation) throw new NotFoundException('Donacion no encontrada');

            let beneficiaryId: number | undefined = undefined;
            const postType = (donation.post && donation.post.typePost && (donation.post.typePost as any).type) ? String((donation.post.typePost as any).type).toLowerCase() : undefined;
            if (postType === 'solicitud de donacion') {
                beneficiaryId = (donation.post && (donation.post as any).user && (donation.post as any).user.id) ? (donation.post as any).user.id : undefined;
            } else {
                beneficiaryId = (donation as any).user && (donation as any).user.id ? (donation as any).user.id : undefined;
            }

            if (!beneficiaryId) throw new BadRequestException('No se pudo determinar el beneficiario de la donacion');

            if (Number(currentUserId) !== Number(beneficiaryId)) {
                throw new ForbiddenException('Solo el beneficiario de la donacion puede dejar una review');
            }

            // evitar que el mismo usuario deje más de una review para la misma donación
            const existing = await this.donationReviewRepository.createQueryBuilder('r')
                .leftJoin('r.donation', 'd')
                .leftJoin('r.user', 'u')
                .where('d.id = :donationId', { donationId })
                .andWhere('u.id = :userId', { userId: currentUserId })
                .getOne();
            if (existing) {
                const sentimentResult = await this.sentimentService.analyzeSentiment(review);
                const sentimentScore = sentimentResult?.sentiment_analysis?.score_1_to_5 ?? 0;
                existing.review = review;
                existing.raiting = Number(sentimentScore);
                const saved = await this.donationReviewRepository.save(existing);
                await this.auditService.createLog(
                    currentUserId,
                    'updateReview',
                    JSON.stringify({
                        message: 'Review actualizada',
                        payload: { donationId: dto.donationId, review: dto.review },
                        response: saved
                    }),
                    200,
                    { donationId: dto.donationId, review: dto.review }
                );
                const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...reviewRest } = saved as any;
                return { ...reviewRest, user: userRest } as any;
            }

            const sentimentResult = await this.sentimentService.analyzeSentiment(review);
            const sentimentScore = sentimentResult?.sentiment_analysis?.score_1_to_5 ?? 0;
            const donationReview = this.donationReviewRepository.create({
                review: review,
                raiting: Number(sentimentScore),
                donation: { id: donation.id },
                user: { id: currentUserId }
            });
            const saved = await this.donationReviewRepository.save(donationReview);
            await this.auditService.createLog(
                currentUserId,
                'createReview',
                JSON.stringify({
                    message: 'Review creada',
                    payload: { donationId: dto.donationId, review: dto.review },
                    response: saved
                }),
                201,
                { donationId: dto.donationId, review: dto.review }
            );
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...reviewRest } = saved as any;
            return { ...reviewRest, user: userRest } as any;
        } catch (error) {
            await this.auditService.createLog(
                currentUserId || 0,
                'createReview',
                JSON.stringify({
                    message: 'Error al crear/actualizar review',
                    payload: { donationId: dto?.donationId, review: dto?.review },
                    response: error?.message || error
                }),
                error?.status || 500,
                { donationId: dto?.donationId, review: dto?.review }
            );
            throw error;
        }
    }

    async getReviewsByDonationId(donationId:number):Promise<DonationReviewEntity[]>{
        try {
            if(!donationId || donationId<=0 || isNaN(donationId) || donationId===undefined){
                throw new BadRequestException('donacion invalida')
            }
            const reviews = await this.donationReviewRepository.createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .leftJoin('review.donation', 'donation')
                .where('donation.id = :donationId', { donationId })
                .orderBy('review.id', 'DESC')
                .getMany();
            if(reviews.length==0){
                return {message: 'No se encontraron comentarios para esta donacion', status: 404} as any;
            }
                const reviewsSanitized = reviews.map(({ user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...reviewRest }) => ({ ...reviewRest, user: userRest }));
            return reviewsSanitized as any;
        } catch (error) {
            throw error;
        }
    }   

    async getAllReviews():Promise<DonationReviewEntity[]>{
        try {
            const reviews = await this.donationReviewRepository.createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .leftJoinAndSelect('review.donation', 'donation')
                .orderBy('review.id', 'DESC')
                .getMany();
            return reviews;
        } catch (error) {
            throw error;
        }
    }

    async deleteReviewById(reviewId:number, currentUserId:number, admin?:boolean):Promise<{message:string, status:number}>{
        try {
            if(!reviewId || reviewId<=0 || isNaN(reviewId) || reviewId===undefined){
                throw new BadRequestException('review invalida')
            }
            const review = await this.donationReviewRepository.createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .where('review.id = :id', { id: reviewId })
                .getOne();
            if(!review){
                throw new BadRequestException('review no encontrada')
            }
            if(review.user.id!==currentUserId && !admin){
                throw new BadRequestException('No tienes permiso para eliminar esta review')
            }
            await this.donationReviewRepository.delete({id:reviewId});
            await this.auditService.createLog(
                currentUserId,
                'deleteReviewById',
                JSON.stringify({
                    message: 'Review eliminada',
                    payload: { reviewId },
                    response: { reviewId }
                }),
                200,
                { reviewId }
            );
            return {message:'Review eliminada correctamente', status:200};
        } catch (error) {
            await this.auditService.createLog(
                currentUserId || 0,
                'deleteReviewById',
                JSON.stringify({
                    message: 'Error al eliminar review',
                    payload: { reviewId },
                    response: error?.message || error
                }),
                error?.status || 500,
                { reviewId }
            );
            throw error;
        }
    }

    async updateReviewById(reviewId:number, currentUserId:number, newReview:string, admin?:boolean):Promise<DonationReviewEntity>{
        try {
            if(!reviewId || reviewId<=0 || isNaN(reviewId) || reviewId===undefined){
                throw new BadRequestException('review invalida')
            }
            const review = await this.donationReviewRepository.createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .where('review.id = :id', { id: reviewId })
                .getOne();
            if(!review){
                throw new BadRequestException('review no encontrada')
            }
            if(review.user.id!==currentUserId && !admin){
                throw new BadRequestException('No tienes permiso para actualizar esta review')
            }
            const sentimentResult = await this.sentimentService.analyzeSentiment(newReview);
            const sentimentScore = sentimentResult.sentiment_analysis.score_1_to_5;
            review.review = newReview;
            review.raiting = Number(sentimentScore);
            const result = await this.donationReviewRepository.save(review);
            await this.auditService.createLog(
                currentUserId,
                'updateReviewById',
                JSON.stringify({
                    message: 'Review actualizada por id',
                    payload: { reviewId, newReview },
                    response: result
                }),
                200,
                { reviewId, newReview }
            );
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...reviewRest } = result;
            return reviewRest as any;
        } catch (error) {
            await this.auditService.createLog(
                currentUserId || 0,
                'updateReviewById',
                JSON.stringify({
                    message: 'Error al actualizar review por id',
                    payload: { reviewId, newReview },
                    response: error?.message || error
                }),
                error?.status || 500,
                { reviewId, newReview }
            );
            throw error;
        }
    }

}