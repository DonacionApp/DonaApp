import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CountryEntity } from '../countries/entities/country.entity';
import { MunicipalityEntity } from '../countries/entities/municipality.entity';
import { RegionEntity } from '../countries/entities/region.entity';

@Injectable()
export class ReferenceDataService {
    constructor(
        @InjectRepository(CountryEntity) private readonly countryRepo: Repository<CountryEntity>,
        @InjectRepository(RegionEntity) private readonly regionRepo: Repository<RegionEntity>,
        @InjectRepository(MunicipalityEntity) private readonly municipalityRepo: Repository<MunicipalityEntity>,
    ) {}

    async listCountries(search?: string, limit?: string) {
        const term = this.normalizeSearch(search);
        const take = this.normalizeLimit(limit);
        const rows = await this.countryRepo.find({
            where: term ? [{ name: ILike(`%${term}%`) }, { code: ILike(`%${term}%`) }] : {},
            order: { name: 'ASC' },
            take,
        });

        return rows.map((country) => ({
            id: country.id,
            value: country.id,
            label: country.name,
            name: country.name,
            code: country.code,
        }));
    }

    async listRegions(countryId?: string, search?: string, limit?: string) {
        const term = this.normalizeSearch(search);
        const take = this.normalizeLimit(limit);
        const qb = this.regionRepo
            .createQueryBuilder('region')
            .orderBy('region.name', 'ASC')
            .take(take);

        if (countryId) {
            qb.andWhere('region.countryId = :countryId', { countryId });
        }
        if (term) {
            qb.andWhere('(region.name ILIKE :term OR region.code ILIKE :term)', { term: `%${term}%` });
        }

        const rows = await qb.getMany();
        return rows.map((region) => ({
            id: region.id,
            value: region.id,
            label: region.name,
            name: region.name,
            code: region.code,
            countryId: region.countryId,
        }));
    }

    async listMunicipalities(regionId?: string, search?: string, limit?: string) {
        const term = this.normalizeSearch(search);
        const take = this.normalizeLimit(limit);
        const qb = this.municipalityRepo
            .createQueryBuilder('municipality')
            .orderBy('municipality.name', 'ASC')
            .take(take);

        if (regionId) {
            qb.andWhere('municipality.regionId = :regionId', { regionId });
        }
        if (term) {
            qb.andWhere('municipality.name ILIKE :term', { term: `%${term}%` });
        }

        const rows = await qb.getMany();
        return rows.map((municipality) => ({
            id: municipality.id,
            value: municipality.id,
            label: municipality.name,
            name: municipality.name,
            regionId: municipality.regionId,
        }));
    }

    private normalizeSearch(search?: string): string {
        return search?.trim() ?? '';
    }

    private normalizeLimit(limit?: string): number {
        const parsed = Number(limit);
        if (!Number.isFinite(parsed) || parsed <= 0) return 50;
        return Math.min(Math.trunc(parsed), 200);
    }
}
