import { ArticleEntity } from "src/modules/article/entity/article.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('post_article')
export class PostArticleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>ArticleEntity,(article)=>article.postArticle, {onDelete:'CASCADE', nullable:false})
    article:ArticleEntity;
    @ManyToOne(()=>PostEntity,(post)=>post.postArticle, {onDelete:'CASCADE', nullable:false})
    post:PostEntity;
}