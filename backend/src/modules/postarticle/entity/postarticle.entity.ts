import { ArticleEntity } from "src/modules/article/entity/article.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostArticleDonationEntity } from "src/modules/postdonationarticle/entity/post.article.donation.entity";
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_article')
export class PostArticleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>ArticleEntity,(article)=>article.postArticle, {onDelete:'CASCADE', nullable:false})
    article:ArticleEntity;
    @ManyToOne(()=>PostEntity,(post)=>post.postArticle, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;

    @OneToMany(()=>PostArticleDonationEntity,(postDonationArticle)=>postDonationArticle.postArticle)
    donationArticle:PostArticleDonationEntity[];
}