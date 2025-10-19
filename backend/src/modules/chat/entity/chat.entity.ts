import { ChatStatusEntity } from "src/modules/chatstatus/entity/chat.status.entity";
import { UserChatEntity } from "src/modules/userchat/entity/user.chat.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('chat')
export class ChatEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>ChatStatusEntity,(chatStatus)=>chatStatus.chat, {onDelete:'CASCADE', nullable:false})
    chatStatus:ChatStatusEntity;
    @OneToMany(()=>UserChatEntity,(userchat)=>userchat.chat)
    userChat:UserChatEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}