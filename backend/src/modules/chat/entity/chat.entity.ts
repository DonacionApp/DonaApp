import { ChatStatusEntity } from "src/modules/chatstatus/entity/chat.status.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('chat')
export class ChatEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    chatName:string;
    @ManyToOne(()=>ChatStatusEntity,(chatStatus)=>chatStatus.chat, {onDelete:'CASCADE', nullable:false})
    chatStatus:ChatStatusEntity;
    @OneToMany(()=>PostEntity,(post)=>post.chat)
    post:PostEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}