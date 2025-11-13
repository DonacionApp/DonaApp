import { ChatEntity } from "src/modules/chat/entity/chat.entity";
import { TypeMessageEntity } from "src/modules/typemessage/entity/type.message.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('message_chat')
export class MessageChatEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'text', nullable:false})
    message:string;

    @ManyToOne(()=>ChatEntity,(chat)=>chat.messageChat, {onDelete:'CASCADE', nullable:false})
    chat:ChatEntity;
    @ManyToOne(()=>TypeMessageEntity,(type)=>type.message, {onDelete:'CASCADE', nullable:false})
    type:TypeMessageEntity;
    @Column({type:'boolean', default:false})
    read:boolean;
    @ManyToOne(()=>UserEntity,(user)=>user.messageChat, {nullable:false, onDelete:'CASCADE'})
    user:UserEntity;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}