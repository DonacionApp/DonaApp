import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('donation_review')
export class DonationReviewEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'text', nullable:false})
    review: string;
    @Column({type:'int', nullable:false})
    raiting: number;
    @ManyToOne(()=>UserEntity,(user)=>user.reviewwDonation, {nullable:false, onDelete:'CASCADE'})
    user:UserEntity;
    @ManyToOne(()=>DonationEntity,(donation)=>donation.reviewwDonation, {nullable:false, onDelete:'CASCADE'})
    donation:DonationEntity;
}