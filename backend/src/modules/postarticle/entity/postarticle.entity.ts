import { ArticleEntity } from "src/modules/article/entity/article.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostArticleDonationEntity } from "src/modules/postdonationarticle/entity/post.article.donation.entity";
import { StatusPostDonationArticle } from "src/modules/statusarticledonation/entity/status.postdonationarticle.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_article')
export class PostArticleEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @ManyToOne(() => ArticleEntity, (article) => article.postArticle, { onDelete: 'CASCADE', nullable: false })
    article: ArticleEntity;
    @ManyToOne(() => PostEntity, (post) => post.postArticle, { onDelete: 'CASCADE', nullable: false })
    post: PostEntity;
    @Column({ type: 'varchar', nullable: false, default: '1' })
    quantity:string;
    @ManyToOne(() => StatusPostDonationArticle, (status) => status.donationArticleStatus, { onDelete: 'CASCADE', nullable: false })
    status: StatusPostDonationArticle;

    @OneToMany(() => PostArticleDonationEntity, (postDonationArticle) => postDonationArticle.postArticle)
    donationArticle: PostArticleDonationEntity[];
}