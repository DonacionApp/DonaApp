import { UserSystemEntity } from "src/modules/usersystem/entity/user.system.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('system')
export class systemEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'text', nullable:false})
    termsAndConditions:string;
    @Column({type:'text', nullable:false})
    privacyPolicy:string;
    @Column({type:'text', nullable:false})
    aboutUs:string;
    @OneToMany(()=>UserSystemEntity,(userSystem)=>userSystem.system)
    userSystem:UserSystemEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}