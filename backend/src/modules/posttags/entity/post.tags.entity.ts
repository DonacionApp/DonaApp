import { PostEntity } from "src/modules/post/entity/post.entity";
import { TagsEntity } from "src/modules/tags/entity/tags.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_tags')
export class PostTagEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>PostEntity,(post)=>post.tags, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
    @ManyToOne(()=>TagsEntity,(tag)=>tag.post, {onDelete:'CASCADE', nullable:false})
    tag:TagsEntity;
    
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}