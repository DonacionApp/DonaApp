import { CommentSupportIdEntity } from "src/modules/commentsupportid/entity/comment.supportid.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('status_supportid')
export class StatusSupportIdEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({ type: 'varchar', length: 100})
    name:string;

    @OneToMany(()=> CommentSupportIdEntity, (comment)=>comment.status)
    comment:CommentSupportIdEntity[];
}