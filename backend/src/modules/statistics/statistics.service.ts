import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entity/user.entity';
import { Repository, Not, IsNull, In } from 'typeorm';
import { PostEntity } from '../post/entity/post.entity';
import { DonationEntity } from '../donation/entity/donation.entity';
import { PostLikedEntity } from '../postLiked/entity/post.liked.entity';
import { UserChatEntity } from '../userchat/entity/user.chat.entity';
import { PostArticleDonationEntity } from '../postdonationarticle/entity/post.article.donation.entity';
import { PostArticleEntity } from '../postarticle/entity/postarticle.entity';
import { ArticleEntity } from '../article/entity/article.entity';

@Injectable()
export class StatisticsService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,

        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>,

        @InjectRepository(DonationEntity)
        private readonly donationRepository: Repository<DonationEntity>,

        @InjectRepository(PostLikedEntity)
        private readonly postLikedRepository: Repository<PostLikedEntity>,

        @InjectRepository(UserChatEntity)
        private readonly userChatRepository: Repository<UserChatEntity>,

        @InjectRepository(PostArticleDonationEntity)
        private readonly postArticleDonationRepository: Repository<PostArticleDonationEntity>,

        @InjectRepository(PostArticleEntity)
        private readonly postArticleRepository: Repository<PostArticleEntity>,

        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
    ){}

    // Devuelve métricas y estadísticas para un usuario específico, ordenadas para charts
    async getUserMetrics(userId: number){
        // Validar existencia de usuario
        const user = await this.userRepository.findOne({where:{id:userId}});
        if(!user) return { error: 'Usuario no encontrado' };

        // Contadores básicos
        const totalPosts = await this.postRepository.count({where: {user: {id: userId}}});
        const totalDonationsAsOwner = await this.donationRepository.count({where: {post: {user: {id: userId}}}});
        const totalDonationsAsDonator = await this.donationRepository.count({where: {user: {id: userId}}});

        // Donaciones por estado cuando es propietario (se asume que statusDonation.status contiene el estado)
        const donations = await this.donationRepository.find({where: {post: {user: {id: userId}}}, relations: ['statusDonation']});
        const donationsByStatusObj = donations.reduce((acc, d) => {
            const s = d.statusDonation?.status || 'UNKNOWN';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Donaciones (como donador) por estado
        const donationsAsDonator = await this.donationRepository.find({where: {user: {id: userId}}, relations: ['statusDonation']});
        const donationsAsDonatorByStatusObj = donationsAsDonator.reduce((acc, d) => {
            const s = d.statusDonation?.status || 'UNKNOWN';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Likes totales recibidos en todos sus posts
        const posts = await this.postRepository.find({where: {user: {id: userId}}});
        const postIds = posts.map(p => p.id);
        const totalLikes = postIds.length ? await this.postLikedRepository.count({ where: { post: In(postIds) } }) : 0;

        // Chats: cantidad de chats donde participa
        const chatsCount = await this.userChatRepository.count({where: {user: {id: userId}}});

        // Artículos más donados y más recibidos con sus cantidades
        // Para 'mas donados' consideramos las PostArticleDonation donde el donador pertenece al usuario (vía donation.user)
        const donatedArticlesRaw = await this.postArticleDonationRepository
            .createQueryBuilder('pad')
            .leftJoin('pad.postArticle', 'pa')
            .leftJoin('pa.article', 'a')
            .leftJoin('pad.donation', 'd')
            .leftJoin('d.user', 'du')
            .where('du.id = :userId', { userId })
            .select('a.id', 'articleId')
            .addSelect('a.name', 'name')
            .addSelect('SUM(CAST(pad.quantity AS INTEGER))', 'quantity')
            .groupBy('a.id')
            .orderBy('quantity', 'DESC')
            .getRawMany();

        const donatedArticles = donatedArticlesRaw.map(r => ({
            articleId: Number(r.articleId),
            name: r.name,
            quantity: Number(r.quantity) || 0,
        }));

        // 'Mas recibidos' cuando el usuario es propietario del post y se recibieron artículos para sus posts
        const receivedArticlesRaw = await this.postArticleDonationRepository
            .createQueryBuilder('pad')
            .leftJoin('pad.postArticle', 'pa')
            .leftJoin('pa.article', 'a')
            .leftJoin('pad.donation', 'd')
            .leftJoin('d.post', 'p')
            .leftJoin('p.user', 'pu')
            .where('pu.id = :userId', { userId })
            .select('a.id', 'articleId')
            .addSelect('a.name', 'name')
            .addSelect('SUM(CAST(pad.quantity AS INTEGER))', 'quantity')
            .groupBy('a.id')
            .orderBy('quantity', 'DESC')
            .getRawMany();

        const receivedArticles = receivedArticlesRaw.map(r => ({
            articleId: Number(r.articleId),
            name: r.name,
            quantity: Number(r.quantity) || 0,
        }));

        // Convertir objetos de estado a arrays {name, value} ordenados (útil para charts)
        const donationsByStatus = Object.entries(donationsByStatusObj).map(([name, value]) => ({ name, value }));
        const donationsAsDonatorByStatus = Object.entries(donationsAsDonatorByStatusObj).map(([name, value]) => ({ name, value }));

        const result = {
            userId,
            totals: {
                totalPosts,
                totalDonationsAsOwner,
                totalDonationsAsDonator,
                totalLikes: Number(totalLikes) || 0,
                chatsCount
            },
            donationsByStatus,
            donationsAsDonatorByStatus,
            donatedArticles,
            receivedArticles
        };

        return result;
    }
}
