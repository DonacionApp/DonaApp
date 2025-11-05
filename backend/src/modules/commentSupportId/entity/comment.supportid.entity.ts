import { StatusSupportIdEntity } from "src/modules/statussupportid/entity/status.supportid.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('comment_supportid')
export class CommentSupportIdEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({ type: 'text'})
    comment:string;

    @ManyToOne(()=> UserEntity,(user)=>user.commentSupportId)
    user:UserEntity;
    @ManyToOne(()=> StatusSupportIdEntity, (status)=>status.comment)
    status:StatusSupportIdEntity;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}