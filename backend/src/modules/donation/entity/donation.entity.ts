import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostArticleDonationEntity } from "src/modules/postdonationarticle/entity/post.article.donation.entity";
import { StatusDonationEntity } from "src/modules/statusdonation/entity/status.donation.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('donation')
export class DonationEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:true})
    lugarRecogida:string | null;
    @Column({type:'varchar', nullable:true})
    lugarDonacion:string | null;
    @Column({type:'json', nullable:true})
    articles:any | null;
    @Column({type:'json', nullable:true})
    comments:any | null;
    @Column({type:'varchar', nullable:true})
    comunity:string | null;
    @Column({type:'date', nullable:true})
    fechaMaximaEntrega:Date | null;
    @ManyToOne(()=>PostEntity,(post)=>post.donation, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
    @ManyToOne(()=>UserEntity,(user)=>user.donation, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>StatusDonationEntity,(statusDonation)=>statusDonation.donation, {onDelete:'SET NULL', nullable:true})
    statusDonation:StatusDonationEntity;
    @OneToMany(()=>PostArticleDonationEntity,(postArticleDonation)=>postArticleDonation.donation)
    postDonationArticlePost:PostArticleDonationEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}