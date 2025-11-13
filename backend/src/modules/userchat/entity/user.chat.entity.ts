import { ChatEntity } from "src/modules/chat/entity/chat.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_chat')
export class UserChatEntity {
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.userChat, {nullable:false, onDelete:'CASCADE'})
    user:UserEntity;
    @ManyToOne(()=>ChatEntity,(chat)=>chat.userChat, {nullable:false, onDelete:'CASCADE'})
    chat:ChatEntity;
    @Column({type:'boolean', default:false})
    donator:boolean;
    @Column({type:'boolean', default:false})
    admin:boolean;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}