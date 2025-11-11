import { ChatEntity } from "src/modules/chat/entity/chat.entity";
import { DonationReviewEntity } from "src/modules/donationreview/entity/donation.review.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostArticleDonationEntity } from "src/modules/postdonationarticle/entity/post.article.donation.entity";
import { StatusDonationEntity } from "src/modules/statusdonation/entity/status.donation.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('donation')
export class DonationEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:true})
    lugarRecogida:string | null;
    @Column({type:'varchar', nullable:true})
    lugarDonacion:string | null;
    @Column({type:'json', nullable:true})
    comments:any | null;
    @Column({type:'date', nullable:true})
    fechaMaximaEntrega:Date | null;
    @Column({type:'boolean', default:false})
    incrementDate:boolean;
    @ManyToOne(()=>PostEntity,(post)=>post.donation, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
    @ManyToOne(()=>UserEntity,(user)=>user.donation, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>StatusDonationEntity,(statusDonation)=>statusDonation.donation, {onDelete:'SET NULL', nullable:true})
    statusDonation:StatusDonationEntity;
    @OneToMany(()=>PostArticleDonationEntity,(postArticleDonation)=>postArticleDonation.donation)
    postDonationArticlePost:PostArticleDonationEntity[];
    @OneToOne(()=>ChatEntity,(chat)=>chat.donation, {onDelete:'CASCADE', nullable:true})
    chat:ChatEntity | null;
    @OneToMany(()=>DonationReviewEntity,(donationrevieww)=>donationrevieww.donation)
    reviewwDonation:DonationReviewEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}