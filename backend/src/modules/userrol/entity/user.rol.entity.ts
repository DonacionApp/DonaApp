import { RolEntity } from "src/modules/rol/entity/rol.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_rol')
export class UserRolEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.id, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>RolEntity,(rol)=>rol.id, {onDelete:'CASCADE', nullable:false})
    rol:RolEntity;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAtColumn:Date;
}