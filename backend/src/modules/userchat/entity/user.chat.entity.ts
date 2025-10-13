import { ChatEntity } from "src/modules/chat/entity/chat.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_chat')
export class UserChatEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.userChat, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>ChatEntity,(chat)=>chat.userChat, {onDelete:'CASCADE', nullable:false})
    chat:ChatEntity;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}