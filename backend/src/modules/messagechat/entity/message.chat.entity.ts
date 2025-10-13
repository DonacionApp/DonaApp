import { TypeMessageEntity } from "src/modules/typemessage/entity/type.message.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('message_chat')
export class MessageChatEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'text', nullable:false})
    message:string;

    chat:any;
    @ManyToOne(()=>TypeMessageEntity,(type)=>type.message, {onDelete:'CASCADE', nullable:false})
    type:TypeMessageEntity;
    @Column({type:'boolean', default:false})
    read:boolean;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}