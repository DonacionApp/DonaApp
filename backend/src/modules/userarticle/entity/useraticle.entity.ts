import { ArticleEntity } from "src/modules/article/entity/article.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('user_article')
export class UserArticleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'int', nullable:false, default:1})
    cant:number;
    @Column({type:'boolean', nullable:false, default:false})
    needed:boolean;W
    @ManyToOne(()=>UserEntity,(user)=>user.userArticle)
    user:UserEntity;
    @ManyToOne(()=> ArticleEntity, (article)=>article.userArticle)
    article:ArticleEntity;
}