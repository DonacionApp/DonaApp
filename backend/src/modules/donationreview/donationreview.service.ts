import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationReviewEntity } from './entity/donation.review.entity';
import { Repository } from 'typeorm';
import { DonationService } from '../donation/donation.service';
import { DonationEntity } from 'src/modules/donation/entity/donation.entity';
import { ConfigService } from '@nestjs/config';
import { CreateReviewDto } from './dto/create.review.dto';
import { SentimentServiceService } from 'src/core/sentiment-service/sentiment-service.service';
import { retry } from 'rxjs';

@Injectable()
export class DonationreviewService {
    constructor(
        @InjectRepository(DonationReviewEntity)
        private readonly donationReviewRepository: Repository<DonationReviewEntity>,
        private readonly donationService:DonationService,
        private readonly configService: ConfigService,
        private readonly sentimentService: SentimentServiceService,
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
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...reviewRest } = saved as any;
            return { ...reviewRest, user: userRest } as any;
        } catch (error) {
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
            return {message:'Review eliminada correctamente', status:200};
        } catch (error) {
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
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...reviewRest } = result;
            return reviewRest as any;
        } catch (error) {
            throw error;
        }
    }

}