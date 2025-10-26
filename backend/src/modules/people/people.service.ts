import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PeopleEntity } from './entity/people.entity';
import { Repository } from 'typeorm';
import { CreatePeopleDto } from './dto/create.people.dto';
import { TypedniService } from '../typedni/typedni.service';
import { CountriesService } from '../countries/countries.service';

@Injectable()
export class PeopleService {
    constructor(
        @InjectRepository(PeopleEntity)
        private readonly peopleRepository: Repository<PeopleEntity>,
        private readonly typedniService: TypedniService,
        private readonly countriesService: CountriesService
    ) { }

    async findAll(): Promise<PeopleEntity[]> {
        try {
            const people = await this.peopleRepository.find({
                relations: {
                    typeDni: true
                }
            });
            if (!people || people.length === 0) {
                throw new BadRequestException('No hay personas registradas');
            }
            return people;
        } catch (error) {
            throw error;
        }
    }

    async findById(idPerson: number): Promise<PeopleEntity> {
        try {
            const person = await this.peopleRepository.findOne({
                where: { id: idPerson }
            });
            if (!person) {
                throw new BadRequestException('Persona no encontrada');
            }
            return person;
        } catch (error) {
            throw error;
        }
    }

    async create(dto: CreatePeopleDto): Promise<PeopleEntity> {
        try {
            if (!dto || !dto.name || !dto.birdthDate || !dto.dni || !dto.tipodDni || !dto.telefono || !dto.residencia) {
                throw new BadRequestException('Los datos de la persona son obligatorios')
            }
            const dniExists = await this.peopleRepository.findOne({
                where: { dni: dto.dni }
            })
            if (dniExists) {
                throw new BadRequestException('La persona con este DNI ya existe');
            }
            const typeDniExists = await this.typedniService.fyndById(dto.tipodDni);
            if (!typeDniExists) {
                throw new BadRequestException('El tipo de DNI no existe');
            };
            const telefonoExists = await this.peopleRepository.findOne({
                where: { telefono: dto.telefono }
            })
            if (telefonoExists) {
                throw new BadRequestException('La persona con este teléfono ya existe');
            }
            if (dto.municipio) {
                const countryIso: string = dto.municipio.pais.iso2;
                const stateIso: string = dto.municipio.state.iso2;
                const cityName: string = dto.municipio.city.name;
                const countyExist = await this.countriesService.getCountryByCode(countryIso);
                if (!countyExist) {
                    throw new BadRequestException('El país del municipio no existe');
                }
                const stateExist = await this.countriesService.getStateBycode(stateIso, countryIso);
                if (!stateExist) {
                    throw new BadRequestException('El estado del municipio no existe');
                }
                const cityExist = await this.countriesService.getCityByName(cityName, stateIso, countryIso);
                if (!cityExist) {
                    throw new BadRequestException('La ciudad del municipio no existe');
                }
            }
            const municipioString = JSON.stringify(dto.municipio) || null;
            dto.municipio = municipioString as any;

            const people = new PeopleEntity();
            people.name = dto.name;
            people.lastName = dto.lastName || null;
            people.birdthDate = dto.birdthDate;
            people.typeDni = typeDniExists;
            people.dni = dto.dni;
            people.residencia = dto.residencia;
            people.telefono = dto.telefono;
            people.supportId = dto.supportId || null;
            people.municipio = municipioString || null;

            const newPerson = this.peopleRepository.create(people);
            return await this.peopleRepository.save(newPerson);

        } catch (error) {
            throw error;
        }
    }

    async update(idPerson: number, dto: CreatePeopleDto): Promise<PeopleEntity> {
        try {
            const person = await this.peopleRepository.findOne({
                where: { id: idPerson }
            });
            if (!person) {
                throw new BadRequestException('Persona no encontrada');
            }
            if (dto.name) {
                person.name = dto.name;
            }
            if (dto.lastName) {
                person.lastName = dto.lastName;
            }
            if (dto.birdthDate) {
                person.birdthDate = dto.birdthDate;
            }
            if (dto.residencia) {
                person.residencia = dto.residencia;
            }
            if (dto.supportId) {
                person.supportId = dto.supportId;
            }
            if (dto.telefono) {
                person.telefono = dto.telefono;
            }
            if (dto.tipodDni) {
                const typeDniExist = await this.typedniService.fyndById(dto.tipodDni);
                if (!typeDniExist) {
                    throw new BadRequestException('El tipo de DNI no existe');
                }
                person.typeDni = typeDniExist;
            }
            if (dto.dni) {
                const dniExists = await this.peopleRepository.findOne({
                    where: { dni: dto.dni }
                })
                if (dniExists) {
                    throw new BadRequestException('La persona con este DNI ya existe');
                }
                person.dni = dto.dni;
            }
            if (dto.municipio) {
                console.log(dto.municipio)
                const countryIso: string = dto.municipio.pais.iso2;
                const stateIso: string = dto.municipio.state.iso2;
                const cityName: string = dto.municipio.city.name;
                const countyExist = await this.countriesService.getCountryByCode(countryIso);
                if (!countyExist) {
                    throw new BadRequestException('El país del municipio no existe');
                }
                const stateExist = await this.countriesService.getStateBycode(stateIso, countryIso);
                if (!stateExist) {
                    throw new BadRequestException('El estado del municipio no existe');
                }
                const cityExist = await this.countriesService.getCityByName(cityName, stateIso, countryIso);
                if (!cityExist) {
                    throw new BadRequestException('La ciudad del municipio no existe');
                }
                person.municipio= JSON.stringify(dto.municipio) as any;
            }
            return await this.peopleRepository.save(person);

        } catch (error) {
            throw error;
        }
    }

    async delete(idPerson: number) {
        try {
            if (!idPerson) {
                throw new BadRequestException('El id de la persona es obligatorio');
            }
            const personExists = await this.peopleRepository.findOne({
                where: { id: idPerson }
            });
            if (!personExists) {
                throw new BadRequestException('Persona no encontrada');
            }
            await this.peopleRepository.delete(idPerson);
            return { message: 'Persona eliminada correctamente' };
        } catch (error) {
            throw error;
        }
    }
}
