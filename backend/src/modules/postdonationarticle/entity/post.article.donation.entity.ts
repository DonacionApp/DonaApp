import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostArticleEntity } from "src/modules/postarticle/entity/postarticle.entity";
import { StatusPostDonationArticle } from "src/modules/statusarticledonation/entity/status.postdonationarticle.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_article_donation')
export class PostArticleDonationEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    donation:DonationEntity;

    post:PostEntity;
    @ManyToOne(()=>PostArticleEntity,(postArticle)=>postArticle.donationArticle, {onDelete:'CASCADE', nullable:false})
    postArticle:PostArticleEntity;
    @ManyToOne(()=>StatusPostDonationArticle,(status)=>status.donationArticleStatus, {onDelete:'CASCADE', nullable:false})
    status:StatusPostDonationArticle;
}