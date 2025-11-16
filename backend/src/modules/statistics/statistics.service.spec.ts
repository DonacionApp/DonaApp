import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/entity/user.entity';
import { PostEntity } from '../post/entity/post.entity';
import { DonationEntity } from '../donation/entity/donation.entity';
import { PostLikedEntity } from '../postLiked/entity/post.liked.entity';
import { UserChatEntity } from '../userchat/entity/user.chat.entity';
import { PostArticleDonationEntity } from '../postdonationarticle/entity/post.article.donation.entity';
import { PostArticleEntity } from '../postarticle/entity/postarticle.entity';
import { ArticleEntity } from '../article/entity/article.entity';
import { DonationReviewEntity } from '../donationreview/entity/donation.review.entity';
//verifica que el servicio de estadisticas este definido
describe('StatisticsService', () => {
  let service: StatisticsService;
//por cada prueba se crea un modulo de testing
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(PostEntity), useValue: {} },
        { provide: getRepositoryToken(DonationEntity), useValue: {} },
        { provide: getRepositoryToken(PostLikedEntity), useValue: {} },
        { provide: getRepositoryToken(UserChatEntity), useValue: {} },
        { provide: getRepositoryToken(PostArticleDonationEntity), useValue: {} },
        { provide: getRepositoryToken(PostArticleEntity), useValue: {} },
        { provide: getRepositoryToken(ArticleEntity), useValue: {} },
        { provide: getRepositoryToken(DonationReviewEntity), useValue: {} },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
