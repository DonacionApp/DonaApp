import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('audit')
export class AuditEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.audit, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @Column({type:'varchar', nullable:false})
    action:string;
    @Column({type:'varchar', nullable:false})
    comment:string;
    @Column({type:'varchar', nullable:false})
    status:string;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}