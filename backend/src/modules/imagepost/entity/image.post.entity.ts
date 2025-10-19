import { PostEntity } from "src/modules/post/entity/post.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('image_post')
export class ImagePostEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>PostEntity,(post)=>post.imagePost, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
    @Column({type:'varchar', nullable:false})
    image:string;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}