import { UserArticleEntity } from "src/modules/userarticle/entity/useraticle.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('article')
export class ArticleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', length:255})
    name: string;
    @OneToMany(()=> UserArticleEntity, (userArticle)=> userArticle.article)
    userArticle:UserArticleEntity[];
}