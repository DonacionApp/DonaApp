import { StatusDonationEntity } from "src/modules/statusdonation/entity/status.donation.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('donation')
export class DonationEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.donation, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>StatusDonationEntity,(statusDonation)=>statusDonation.donation, {onDelete:'SET NULL', nullable:true})
    statusDonation:StatusDonationEntity;
    @Column({type:'varchar', nullable:false})
    lugarEntrega:string;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}