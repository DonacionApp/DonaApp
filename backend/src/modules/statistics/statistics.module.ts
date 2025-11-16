import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entity/user.entity';
import { PostEntity } from '../post/entity/post.entity';
import { DonationEntity } from '../donation/entity/donation.entity';
import { PostLikedEntity } from '../postLiked/entity/post.liked.entity';
import { UserChatEntity } from '../userchat/entity/user.chat.entity';
import { PostArticleDonationEntity } from '../postdonationarticle/entity/post.article.donation.entity';
import { ArticleEntity } from '../article/entity/article.entity';
import { PostArticleEntity } from '../postarticle/entity/postarticle.entity';
import { DonationReviewEntity } from '../donationreview/entity/donation.review.entity';

// Módulo de estadísticas: importa los repositorios necesarios para las consultas
@Module({
  imports: [TypeOrmModule.forFeature([
    UserEntity,
    PostEntity,
    DonationEntity,
    PostLikedEntity,
    UserChatEntity,
    PostArticleDonationEntity,
    PostArticleEntity,
    ArticleEntity,
    DonationReviewEntity
  ])],
  controllers: [StatisticsController],
  providers: [StatisticsService]
})
export class StatisticsModule {}
