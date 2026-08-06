import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CountryEntity } from './country.entity';

@Entity('regions')
export class RegionEntity {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @Column({ name: 'countryId', type: 'int' })
    countryId: number;

    @ManyToOne(() => CountryEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'countryId' })
    country: CountryEntity;

    @Column({ type: 'varchar', nullable: true })
    code: string | null;

    @Column({ type: 'varchar' })
    name: string;
}
