import { ChatEntity } from "src/modules/chat/entity/chat.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('chat_status')
export class ChatStatusEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', unique:true, nullable:false})
    status:string;
    @OneToMany(()=>ChatEntity,(chat)=>chat.chatStatus)
    chat:ChatEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}