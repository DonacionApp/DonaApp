import { PostArticleEntity } from "src/modules/postarticle/entity/postarticle.entity";
import { UserArticleEntity } from "src/modules/userarticle/entity/useraticle.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('article')
export class ArticleEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', length:255})
    name: string;
    @Column({type:'text', nullable:true})
    descripcion:string;
    @OneToMany(()=> UserArticleEntity, (userArticle)=> userArticle.article)
    userArticle:UserArticleEntity[];
    @OneToMany(()=> PostArticleEntity,(postArticle)=>postArticle.article)
    postArticle:PostArticleEntity[];

    @Column({type:'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;
    @Column({type:'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt: Date;
}