import { PostEntity } from "src/modules/post/entity/post.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_liked')
export class PostLikedEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>PostEntity,(post)=>post.postLiked, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
    @ManyToOne(()=>UserEntity,(user)=>user.postLiked, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}