import { MessageChatEntity } from "src/modules/messagechat/entity/message.chat.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('type_message')
export class TypeMessageEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', unique:true, nullable:false})
    type:string;
    @OneToMany(()=>MessageChatEntity,(message)=>message.type)
    message:MessageChatEntity[];
    
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}