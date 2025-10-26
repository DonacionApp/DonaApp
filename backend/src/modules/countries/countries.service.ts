import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_KEY_COUNTRIES_API, URL_COUNTRIES_API } from 'src/config/constants';
import { CountryDto } from './dto/countries.dto';
import { Console } from 'console';

@Injectable()
export class CountriesService {
    constructor(
        private readonly configService: ConfigService
    ) {
    }
    async getData(): Promise<{ urlApi: string, apiKey: string }> {
        const urlCountriesApi = this.configService.get<string>(URL_COUNTRIES_API);
        const apikey = this.configService.get<string>(API_KEY_COUNTRIES_API);
        if (!urlCountriesApi || !apikey) {
            throw new Error('Countries API configuration is missing');
        }
        return { urlApi: urlCountriesApi, apiKey: apikey };
    }



    async getCountriesData(): Promise<CountryDto[]> {
        try {
            const { urlApi, apiKey } = await this.getData();

            const response = await fetch(`${urlApi}/countries`, {
                method: 'GET',
                headers: {
                    'X-CSCAPI-KEY': apiKey,
                    'Content-Type': 'application/json',
                },
            });
            console.log(response)

            if (!response.ok) {
                throw new Error(`Failed to fetch countries data: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No countries data found');
            }

            return data.map(
                (country: any) =>
                    new CountryDto({
                        id: country.id,
                        name: country.name,
                        iso2: country.iso2,
                        iso3: country.iso3,
                        phonecode: country.phonecode,
                        capital: country.capital,
                        currency: country.currency,
                        native: country.native,
                        emoji: country.emoji,
                    }),
            );
        } catch (error) {
            console.error('Error fetching countries:', error);
            throw error;
        }
    }

    async getCountryByCode(iso:string):Promise<CountryDto|null>{
        try {
            const countries = await this.getCountriesData();
            const country = countries.find(c => c.iso2.toLowerCase() === iso.toLowerCase() || c.iso3.toLowerCase() === iso.toLowerCase());
            return country || null;
        } catch (error) {
            console.error('Error fetching country by code:', error);
            throw error;
        }
    }
    async getCountryByname(name:string):Promise<CountryDto|null>{
        try {
            const countries = await this.getCountriesData();
            const country = countries.find(c => c.name.toLowerCase() === name.toLowerCase());
            return country || null;
        } catch (error) {
            console.error('Error fetching country by name:', error);
            throw error;
        }
    }

    async getCountryById(id:number):Promise<CountryDto|null>{
        try {
            const countries = await this.getCountriesData();
            const country = countries.find(c => c.id === id);
            return country || null;
        } catch (error) {
            console.error('Error fetching country by id:', error);
            throw error;
        }
    }

    async getStatesByCountry(iso:string):Promise<any[]>{
        try {
            const { urlApi, apiKey } = await this.getData();

            const response = await fetch(`${urlApi}/countries/${iso}/states`, {
                method: 'GET',
                headers: {
                    'X-CSCAPI-KEY': apiKey,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch states for country ${iso}: ${response.status}`);
            }
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`No states found for country ${iso}`);
            }

            return data.map((state: any) => ({
                id: state.id,
                name: state.name,
                countryId: state.country_id,
                iso2: state.iso2,
            }));
        } catch (error) {
            console.error('Error fetching states by country:', error);
            throw error;
        }
    }

    async getStateBycode(stateIso:string, countryIso:string):Promise<any|null>{
        try {
            const states = await fetch(`${(await this.getData()).urlApi}/countries/${countryIso}/states/${stateIso}`, {
                method: 'GET',
                headers: {
                    'X-CSCAPI-KEY': (await this.getData()).apiKey,
                    'Content-Type': 'application/json',
                },
            });
            if (!states.ok) {
                throw new Error(`Failed to fetch state ${stateIso} for country ${countryIso}: ${states.status}`);
            }
            const data = await states.json();
            return data || null;
        } catch (error) {
            console.error('Error fetching state by code:', error);
            throw error;
        }
    }

    async getCitiesByState(stateIso:string, countryIso:string):Promise<any[]>{
        try {
            const { urlApi, apiKey } = await this.getData();

            const response = await fetch(`${urlApi}/countries/${countryIso}/states/${stateIso}/cities`, {
                method: 'GET',
                headers: {
                    'X-CSCAPI-KEY': apiKey,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch cities for state ${stateIso}: ${response.status}`);
            }
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`No cities found for state ${stateIso}`);
            }

            return data.map((city: any) => ({
                id: city.id,
                name: city.name,
                stateId: city.state_id,
                countryId: city.country_id,
            }));
        } catch (error) {
            console.error('Error fetching cities by state:', error);
            throw error;
        }
    }

    async getCityByName(cityName:string, stateIso:string, countryIso:string):Promise<any|null>{
        try {
            const cities = await this.getCitiesByState(stateIso, countryIso);
            const city = cities.find(c => c.name?.toLowerCase() === cityName.toLowerCase());
            return city || null;
        } catch (error) {
            throw error;
        }
    }

    async getCityById(cityId:number, stateIso:string, countryIso:string):Promise<any|null>{
        try {
            const cities = await this.getCitiesByState(stateIso, countryIso);
            const city = cities.find(c => c.id === cityId);
            return city || null;
        } catch (error) {
            throw error;
        }
    }
 
    
}
