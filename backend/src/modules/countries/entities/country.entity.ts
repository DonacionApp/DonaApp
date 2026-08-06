import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('countries')
export class CountryEntity {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @Column({ type: 'varchar', nullable: true })
    code: string | null;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    phoneCode: string | null;
}
