import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RegionEntity } from './region.entity';

@Entity('municipalities')
export class MunicipalityEntity {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @Column({ name: 'regionId', type: 'int' })
    regionId: number;

    @ManyToOne(() => RegionEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'regionId' })
    region: RegionEntity;

    @Column({ type: 'varchar' })
    name: string;
}
