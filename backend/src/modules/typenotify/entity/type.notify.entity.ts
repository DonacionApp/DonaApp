import { NotifyEntity } from "src/modules/notify/entity/notify.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('type_notify')
export class TypeNotifyEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', unique:true, nullable:false})
    type:string;
    @OneToMany(()=>NotifyEntity,(notify)=>notify.type)
    notify:NotifyEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}