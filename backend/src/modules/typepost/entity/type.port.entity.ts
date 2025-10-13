import { PostEntity } from "src/modules/post/entity/post.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('type_post')
export class TypePostEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', unique:true, nullable:false})
    type:string;
    @OneToMany(()=>PostEntity,(post)=>post.typePost)
    post:PostEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}