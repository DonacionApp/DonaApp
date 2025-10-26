import { Controller, Get, Param } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    async getCountries() {
        try {
            return this.countriesService.getCountriesData();
        } catch (error) {
            throw error;
        }
    }

    @Get('/iso/:iso')
    async getCountryByCode(@Param('iso') iso: string) {
        try {
            return this.countriesService.getCountryByCode(iso);
        } catch (error) {
            throw error;
        }
    }

    @Get('/name/:name')
    async getCountryByName(@Param('name') name: string) {
        try {
            return this.countriesService.getCountryByname(name);
        } catch (error) {
            throw error;
        }
    }

    @Get('/id/:id')
    async getCountryById(@Param('id') id: string) {
        try {
            return this.countriesService.getCountryById(+id);
        } catch (error) {
            throw error;
        }
    }

    @Get('/states/iso/:iso')
    async getStatesByCountry(@Param('iso') iso: string) {
        try {
            return this.countriesService.getStatesByCountry(iso);
        } catch (error) {
            throw error;
        }
    }
    @Get('countries/:iso/state/:stateIso')
    async getStateByIso( @Param('stateIso') stateIso: string, @Param('iso') countryIso: string) {
        try {
            return this.countriesService.getStateBycode(stateIso, countryIso);
        } catch (error) {
            throw error;
        }
    }

    @Get('/countries/:iso/states/:stateIso/cities')
    async getCitiesByCountry( @Param('stateIso') stateIso: string, @Param('iso') countryIso: string) {
        try {
            return this.countriesService.getCitiesByState(stateIso, countryIso);
        } catch (error) {
            throw error;
        }
    }

    @Get('/countries/:iso/states/:stateIso/cities/:cityId')
    async getCityById( @Param('cityId') cityId: string, @Param('stateIso') stateIso: string, @Param('iso') countryIso: string) {
        try {
            return this.countriesService.getCityById(+(cityId), stateIso, countryIso);
        } catch (error) {
            throw error;
        }
    }

    @Get('/countries/:iso/states/:stateIso/cities/name/:cityName')
    async getCityByName( @Param('cityName') cityName: string, @Param('stateIso') stateIso: string, @Param('iso') countryIso: string) {
        try {
            return this.countriesService.getCityByName(cityName, stateIso, countryIso);
        } catch (error) {
            throw error;
        }
    }



}
