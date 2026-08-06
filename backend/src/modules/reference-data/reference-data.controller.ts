import { Controller, Get, Query } from '@nestjs/common';
import { ReferenceDataService } from './reference-data.service';

@Controller('reference-data')
export class ReferenceDataController {
    constructor(private readonly service: ReferenceDataService) {}

    @Get('countries')
    listCountries(@Query('search') search?: string, @Query('limit') limit?: string) {
        return this.service.listCountries(search, limit);
    }

    @Get('regions')
    listRegions(
        @Query('countryId') countryId?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.listRegions(countryId, search, limit);
    }

    @Get('municipalities')
    listMunicipalities(
        @Query('regionId') regionId?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.listMunicipalities(regionId, search, limit);
    }
}
