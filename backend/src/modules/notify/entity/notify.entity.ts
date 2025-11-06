import { TypeNotifyEntity } from "src/modules/typenotify/entity/type.notify.entity";
import { UserNotifyEntity } from "src/modules/userNotify/entity/user.notify.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('notify')
export class NotifyEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    title:string;
    @Column({type:'varchar', nullable:false})
    message:string;
    @ManyToOne(()=>TypeNotifyEntity,(type)=>type.notify, {onDelete:'CASCADE', nullable:false})
    type:TypeNotifyEntity;
    @OneToMany(()=>UserNotifyEntity,(userNotify)=>userNotify.notify)
    userNotify:UserNotifyEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}