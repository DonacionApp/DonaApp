import 'reflect-metadata';
import dataSource from '../../data-source';
import { CountryEntity } from '../../modules/countries/entities/country.entity';
import { MunicipalityEntity } from '../../modules/countries/entities/municipality.entity';
import { RegionEntity } from '../../modules/countries/entities/region.entity';
import { COUNTRIES } from './data/countries';
import { MUNICIPALITIES } from './data/municipalities';
import { REGIONS } from './data/regions';

const CHUNK_SIZE = 1000;

function chunk<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        batches.push(items.slice(i, i + size));
    }
    return batches;
}

async function main(): Promise<void> {
    const ds = await dataSource.initialize();
    try {
        const countryRepo = ds.getRepository(CountryEntity);
        const regionRepo = ds.getRepository(RegionEntity);
        const municipalityRepo = ds.getRepository(MunicipalityEntity);

        const countries = COUNTRIES.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            phoneCode: c.phoneCode,
        }));
        for (const batch of chunk(countries, CHUNK_SIZE)) {
            await countryRepo.upsert(batch, ['id']);
        }
        console.log(`Países: ${countries.length}`);

        const regions = REGIONS.map((r) => ({
            id: r.id,
            name: r.name,
            code: r.stateCode || null,
            countryId: r.countryId,
        }));
        for (const batch of chunk(regions, CHUNK_SIZE)) {
            await regionRepo.upsert(batch, ['id']);
        }
        console.log(`Regiones: ${regions.length}`);

        const municipalities = MUNICIPALITIES.map(([id, name, regionId]) => ({
            id,
            name,
            regionId,
        }));
        for (const batch of chunk(municipalities, CHUNK_SIZE)) {
            await municipalityRepo.upsert(batch, ['id']);
        }
        console.log(`Municipios: ${municipalities.length}`);

        console.log('Seed de ubicaciones completado.');
    } finally {
        await ds.destroy();
    }
}

main().catch((err) => {
    console.error('Seed de ubicaciones falló:', err);
    process.exit(1);
});
