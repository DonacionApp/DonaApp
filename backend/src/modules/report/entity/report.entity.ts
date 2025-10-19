import { TypeReportEntity } from "src/modules/typeReport/entity/type.report.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('report')
export class ReportEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>UserEntity,(user)=>user.report, {onDelete:'CASCADE', nullable:false})
    user:UserEntity;
    @ManyToOne(()=>TypeReportEntity,(typeReport)=>typeReport.report, {onDelete:'CASCADE', nullable:false})
    typeReport:TypeReportEntity;
    @Column({type:'varchar', nullable:false})
    comments:string;

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}