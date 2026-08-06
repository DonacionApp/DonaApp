import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryDto } from './dto/countries.dto';
import { CountryEntity } from './entities/country.entity';
import { MunicipalityEntity } from './entities/municipality.entity';
import { RegionEntity } from './entities/region.entity';

@Injectable()
export class CountriesService {
    constructor(
        @InjectRepository(CountryEntity)
        private readonly countryRepository: Repository<CountryEntity>,
        @InjectRepository(RegionEntity)
        private readonly regionRepository: Repository<RegionEntity>,
        @InjectRepository(MunicipalityEntity)
        private readonly municipalityRepository: Repository<MunicipalityEntity>,
    ) {}

    private toCountryDto(country: CountryEntity): CountryDto {
        return new CountryDto({
            id: country.id,
            name: country.name,
            iso2: country.code ?? '',
            iso3: null,
            phonecode: country.phoneCode,
        });
    }

    async getCountriesData(): Promise<CountryDto[]> {
        const countries = await this.countryRepository.find({ order: { name: 'ASC' } });
        return countries.map((country) => this.toCountryDto(country));
    }

    async getCountryByCode(iso: string): Promise<CountryDto | null> {
        if (!iso) {
            return null;
        }
        const country = await this.countryRepository
            .createQueryBuilder('country')
            .where('LOWER(country.code) = LOWER(:iso)', { iso })
            .getOne();
        return country ? this.toCountryDto(country) : null;
    }

    async getCountryByname(name: string): Promise<CountryDto | null> {
        if (!name) {
            return null;
        }
        const country = await this.countryRepository
            .createQueryBuilder('country')
            .where('LOWER(country.name) = LOWER(:name)', { name })
            .getOne();
        return country ? this.toCountryDto(country) : null;
    }

    async getCountryById(id: number): Promise<CountryDto | null> {
        const country = await this.countryRepository.findOne({ where: { id } });
        return country ? this.toCountryDto(country) : null;
    }

    async getStatesByCountry(iso: string): Promise<any[]> {
        if (!iso) {
            return [];
        }
        const country = await this.getCountryByCode(iso);
        if (!country) {
            return [];
        }
        const regions = await this.regionRepository.find({
            where: { countryId: country.id },
            order: { name: 'ASC' },
        });
        return regions.map((region) => ({
            id: region.id,
            name: region.name,
            countryId: region.countryId,
            iso2: region.code,
        }));
    }

    async getStateBycode(stateIso: string, countryIso: string): Promise<any | null> {
        if (!stateIso || !countryIso) {
            return null;
        }
        const country = await this.getCountryByCode(countryIso);
        if (!country) {
            return null;
        }
        const region = await this.regionRepository
            .createQueryBuilder('region')
            .where('region.countryId = :countryId', { countryId: country.id })
            .andWhere('LOWER(region.code) = LOWER(:stateIso)', { stateIso })
            .getOne();
        return region
            ? { id: region.id, name: region.name, countryId: region.countryId, iso2: region.code }
            : null;
    }

    async getCitiesByState(stateIso: string, countryIso: string): Promise<any[]> {
        if (!stateIso || !countryIso) {
            return [];
        }
        const region = await this.getStateBycode(stateIso, countryIso);
        if (!region) {
            return [];
        }
        const municipalities = await this.municipalityRepository.find({
            where: { regionId: region.id },
            order: { name: 'ASC' },
        });
        return municipalities.map((municipality) => ({
            id: municipality.id,
            name: municipality.name,
            stateId: municipality.regionId,
        }));
    }

    async getCityByName(cityName: string, stateIso: string, countryIso: string): Promise<any | null> {
        if (!cityName || !stateIso || !countryIso) {
            return null;
        }
        const region = await this.getStateBycode(stateIso, countryIso);
        if (!region) {
            return null;
        }
        const municipality = await this.municipalityRepository
            .createQueryBuilder('municipality')
            .where('municipality.regionId = :regionId', { regionId: region.id })
            .andWhere('LOWER(municipality.name) = LOWER(:cityName)', { cityName })
            .getOne();
        return municipality ? { id: municipality.id, name: municipality.name, stateId: municipality.regionId } : null;
    }

    async getCityById(cityId: number, stateIso: string, countryIso: string): Promise<any | null> {
        if (!cityId || !stateIso || !countryIso) {
            return null;
        }
        const region = await this.getStateBycode(stateIso, countryIso);
        if (!region) {
            return null;
        }
        const municipality = await this.municipalityRepository.findOne({
            where: { id: cityId, regionId: region.id },
        });
        return municipality ? { id: municipality.id, name: municipality.name, stateId: municipality.regionId } : null;
    }
}
