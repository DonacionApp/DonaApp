import { ReportEntity } from "src/modules/report/entity/report.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('type_report')
export class typeReportEntity{
    @PrimaryGeneratedColumn()
    id:number;
    @Column({type:'varchar', length:100, unique:true, nullable:false})
    type:string;
    @OneToMany(()=>ReportEntity,(report)=>report.typeReport)
    report:ReportEntity[];

    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP'})
    createdAt:Date;
    @Column({type:'timestamp', default:()=> 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt:Date;
}