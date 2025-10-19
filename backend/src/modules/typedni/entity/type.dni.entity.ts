import { PeopleEntity } from "src/modules/people/entity/people.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('type_dni')
export class TypeDniEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', unique:true, length:50, })
    type:string;

    @OneToMany(()=>PeopleEntity,(people)=>people.typeDni)
    people:PeopleEntity[];
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}