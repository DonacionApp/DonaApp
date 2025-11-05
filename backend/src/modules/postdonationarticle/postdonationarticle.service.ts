import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostArticleDonationEntity } from './entity/post.article.donation.entity';
import { Repository } from 'typeorm';
import { PostService } from '../post/post.service';
import { PostarticleService } from '../postarticle/postarticle.service';
import { FilterSearchPostDonationArticleDto } from './dto/filter.search.dto';

@Injectable()
export class PostdonationarticleService {
    constructor(
        @InjectRepository(PostArticleDonationEntity)
        private readonly postDonationArticleRepository: Repository<PostArticleDonationEntity>,
        private readonly postServiece: PostService,
        private readonly postArticleService: PostarticleService,
    ) { }

    async getAllArticlesFromDonation(filter: FilterSearchPostDonationArticleDto): Promise<any> {
        try {
            const qb = this.postDonationArticleRepository
                .createQueryBuilder('pad')
                .leftJoinAndSelect('pad.donation', 'donation')   
                .leftJoinAndSelect('pad.post', 'post')
                .leftJoinAndSelect('pad.postArticle', 'postArticle')
                .leftJoinAndSelect('postArticle.status', 'status')      
                .leftJoinAndSelect('donation.user', 'donationUser')
                .leftJoinAndSelect('post.user', 'postUser')
                .leftJoinAndSelect('postArticle.article', 'article');

            if (filter.donationId) {
                qb.andWhere('pad.donationId = :donationId', { donationId: filter.donationId });
            }
            if (filter.postId) {
                qb.andWhere('pad.postId = :postId', { postId: filter.postId });
            }
            if (filter.postArticleId) {
                qb.andWhere('pad.postArticleId = :postArticleId', { postArticleId: filter.postArticleId });
            }
            if (filter.search) {
                qb.andWhere('(post.title ILIKE :search OR post.message ILIKE :search OR article.name ILIKE :search OR article.descripcion ILIKE :search)', { search: `%${filter.search}%` });
            }

            return await qb.getMany();
        } catch (error) {
            throw error;
        }
    }

    async addArticleToDonationFromPost() { }
}
