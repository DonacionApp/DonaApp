import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostArticleEntity } from "src/modules/postarticle/entity/postarticle.entity";
import { StatusPostDonationArticle } from "src/modules/statusarticledonation/entity/status.postdonationarticle.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_article_donation')
export class PostArticleDonationEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>DonationEntity,(donation)=>donation.postDonationArticlePost, {onDelete:'CASCADE', nullable:false})
    donation:DonationEntity;
    @ManyToOne(()=>PostEntity,(post)=>post.donationArticlePost, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
    @ManyToOne(()=>PostArticleEntity,(postArticle)=>postArticle.donationArticle, {onDelete:'CASCADE', nullable:false})
    postArticle:PostArticleEntity;
}