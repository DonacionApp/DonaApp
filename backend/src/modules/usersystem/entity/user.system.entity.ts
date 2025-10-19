import { systemEntity } from "src/modules/system/entity/system.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_system')
export class UserSystemEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.userSystem, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>systemEntity,(system)=>system.userSystem, {onDelete:'CASCADE', nullable:false})
    system:systemEntity

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}