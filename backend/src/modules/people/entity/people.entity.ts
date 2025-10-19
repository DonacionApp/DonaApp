import { TypeDniEntity } from "src/modules/typedni/entity/type.dni.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('people')
export class PeopleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', length:50, nullable:false})
    name:string;
    @Column({type:'varchar', length:50, nullable:true})
    lastName:string | null;
    @Column({type:'date', nullable:false})
    birdthDate:Date;
    @ManyToOne(()=>TypeDniEntity,(typeDni)=>typeDni.people, {onDelete:'CASCADE', nullable:false})
    typeDni:TypeDniEntity;
    @Column({type:'varchar', length:15, unique:true, nullable:false})
    dni:string;
    @Column({type:'varchar', length:100, nullable:false})
    residencia:string;
    @Column({type:"varchar", length:10, unique:true, nullable:false})
    telefono: string;
    @Column({type:'varchar', length:100, nullable:true})
    supportId:string | null;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;

    @OneToOne(()=>UserEntity,(user)=>user.people)
    user:UserEntity;
}