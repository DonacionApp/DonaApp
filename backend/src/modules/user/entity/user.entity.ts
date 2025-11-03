import { AuditEntity } from "src/modules/audit/entity/audit.entity";
import { DonationEntity } from "src/modules/donation/entity/donation.entity";
import { PeopleEntity } from "src/modules/people/entity/people.entity";
import { PostEntity } from "src/modules/post/entity/post.entity";
import { PostLikedEntity } from "src/modules/postLiked/entity/post.liked.entity";
import { ReportEntity } from "src/modules/report/entity/report.entity";
import { RolEntity } from "src/modules/rol/entity/rol.entity";
import { UserArticleEntity } from "src/modules/userarticle/entity/useraticle.entity";
import { UserChatEntity } from "src/modules/userchat/entity/user.chat.entity";
import { UserNotifyEntity } from "src/modules/userNotify/entity/user.notify.entity";
import { UserSystemEntity } from "src/modules/usersystem/entity/user.system.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user')
export class UserEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', length:100, unique:true, nullable:false})
    username:string;
    @Column({type:'varchar', unique:true, nullable:false})
    email:string;
    @Column({type:'varchar', nullable:false})
    password:string;
    @Column({type:'varchar', nullable:true})
    token:string | null;
    @Column({type:'int', default:0})
    loginAttempts:number;
    @Column({type:'timestamp', nullable:true})
    lockUntil: Date | null;
    @Column({type:'varchar', nullable:true})
    profilePhoto:string | null;
    @Column({type:'timestamp', nullable:true})
    dateSendCodigo:Date | null;
    @Column({type:'timestamp', nullable:true})
    lastLogin:Date | null;
    @Column({type:'boolean', default:false})
    emailVerified:boolean;
    @Column({type:'boolean', default:false})
    verified:boolean;
    @Column({type:'varchar', nullable:true})
    code:string | null;
    @Column({type:'boolean', default:true})
    block:boolean;
    @OneToOne(()=>PeopleEntity,(people)=>people.user, {onDelete:'CASCADE', nullable:false})
    @JoinColumn()
    people:PeopleEntity;
    @ManyToOne(()=>RolEntity,(rol)=>rol.user, {nullable:false, onDelete:'SET NULL'})
    rol:RolEntity;
    @OneToMany(()=>UserNotifyEntity,(userNotify)=>userNotify.user)
    notifyUser:UserNotifyEntity[];
    @OneToMany(()=>PostEntity,(post)=>post.user)
    post:PostEntity[];
    @OneToMany(()=>UserChatEntity,(userChat)=>userChat.user)
    userChat:UserChatEntity[];
    @OneToMany(()=>DonationEntity,(donation)=>donation.user)
    donation:DonationEntity[];
    @OneToMany(()=>ReportEntity,(report)=>report.user)
    report:ReportEntity[];
    @OneToMany(()=>AuditEntity,(audit)=>audit.user)
    audit:AuditEntity[];
    @OneToMany(()=>UserSystemEntity,(userSystem)=>userSystem.user)
    userSystem:UserSystemEntity[];
    @OneToMany(()=>PostLikedEntity,(postLiked)=>postLiked.user)
    postLiked:PostLikedEntity[];
    @OneToMany(()=>UserArticleEntity,(userArticle)=>userArticle.user)
    userArticle:UserArticleEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}