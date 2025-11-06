
import { PostArticleEntity } from "src/modules/postarticle/entity/postarticle.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('status_post_donation_article')
export class StatusPostDonationArticle{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    status:string;

    @OneToMany(()=>PostArticleEntity,(postDonationArticle)=>postDonationArticle.status)
    donationArticleStatus:PostArticleEntity[];
}