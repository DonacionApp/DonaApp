import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryEntity } from '../countries/entities/country.entity';
import { MunicipalityEntity } from '../countries/entities/municipality.entity';
import { RegionEntity } from '../countries/entities/region.entity';
import { ReferenceDataController } from './reference-data.controller';
import { ReferenceDataService } from './reference-data.service';

@Module({
    imports: [TypeOrmModule.forFeature([CountryEntity, RegionEntity, MunicipalityEntity])],
    controllers: [ReferenceDataController],
    providers: [ReferenceDataService],
    exports: [ReferenceDataService],
})
export class ReferenceDataModule {}
