import { ArticleEntity } from "src/modules/article/entity/article.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('user_article')
export class UserArticleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.userArticle)
    user:UserEntity;
    @ManyToOne(()=> ArticleEntity, (article)=>article.userArticle)
    article:ArticleEntity;
}