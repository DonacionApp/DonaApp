import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('status_donation')
export class StatusDonationEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', length:50, unique:true, nullable:false})
    status:string;
    @OneToMany(()=>DonationEntity,(donation)=>donation.statusDonation)
    donation:DonationEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}