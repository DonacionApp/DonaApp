import { ChatStatusEntity } from "src/modules/chatstatus/entity/chat.status.entity";
import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('chat')
export class ChatEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    chatName:string;
    @ManyToOne(()=>ChatStatusEntity,(chatStatus)=>chatStatus.chat, {onDelete:'CASCADE', nullable:false})
    chatStatus:ChatStatusEntity;
    @OneToOne(()=>DonationEntity,(donation)=>donation.chat, {onDelete:'CASCADE', nullable:true})
    @JoinColumn()
    donation:DonationEntity | null;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}