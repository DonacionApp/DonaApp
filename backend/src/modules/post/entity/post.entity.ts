import { ChatEntity } from "src/modules/chat/entity/chat.entity";
import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { ImagePostEntity } from "src/modules/imagepost/entity/image.post.entity";
import { PostArticleEntity } from "src/modules/postarticle/entity/postarticle.entity";
import { PostLikedEntity } from "src/modules/postLiked/entity/post.liked.entity";
import { PostTagEntity } from "src/modules/posttags/entity/post.tags.entity";
import { TypePostEntity } from "src/modules/typepost/entity/type.port.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('post')
export class PostEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', nullable:false})
    title:string;
    @Column({type:'text', nullable:false})
    message:string;

    @ManyToOne(()=>UserEntity,(user)=>user.post, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>TypePostEntity,(typePost)=>typePost.post, {onDelete:'CASCADE', nullable:true})
    typePost: TypePostEntity | null;
    @OneToMany(()=>PostTagEntity,(postTag)=>postTag.post)
    tags:PostTagEntity[];
    @OneToMany(()=>ImagePostEntity,(image)=>image.post)
    imagePost:ImagePostEntity[]
    @OneToMany(()=>PostLikedEntity,(postLiked)=>postLiked.post)
    postLiked:PostLikedEntity[];
    @OneToMany(()=>DonationEntity,(donation)=>donation.post)
    donation:DonationEntity[];
    @OneToMany(()=>PostArticleEntity,(postArticle)=>postArticle.post)
    postArticle:PostArticleEntity[];
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}