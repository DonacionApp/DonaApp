import { NotifyEntity } from "src/modules/notify/entity/notify.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('user_notify')
export class UserNotifyEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.notifyUser, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>NotifyEntity,(notify)=>notify.userNotify, {onDelete:'CASCADE', nullable:false})
    notify:NotifyEntity;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}