import { PostArticleDonationEntity } from "src/modules/postdonationarticle/entity/post.article.donation.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('status_post_donation_article')
export class StatusPostDonationArticle{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    status:string;

    donationArticleStatus:PostArticleDonationEntity[];
}