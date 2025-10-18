import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PeopleEntity } from './entity/people.entity';
import { Repository } from 'typeorm';
import { CreatePeopleDto } from './dto/create.people.dto';
import { TypedniService } from '../typedni/typedni.service';

@Injectable()
export class PeopleService {
    constructor(
        @InjectRepository(PeopleEntity)
        private readonly peopleRepository: Repository<PeopleEntity>,
        private readonly typedniService: TypedniService,
    ){}

    async findAll():Promise<PeopleEntity[]>{
        try {
            const people= await this.peopleRepository.find();
            if (!people || people.length===0){
                throw new BadRequestException('No hay personas registradas');
            }
            return people;
        } catch (error) {
            throw error;
        }
    }

    async findById(idPerson:number):Promise<PeopleEntity>{
        try {
            const person = await this.peopleRepository.findOne({
                 where: { id: idPerson } });
            if (!person) {
                throw new BadRequestException('Persona no encontrada');
            }
            return person;
        } catch (error) {
            throw error;
        }
    }

    async create(dto: CreatePeopleDto):Promise<PeopleEntity>{
        try {
        if(!dto || !dto.name || !dto.birdthDate || !dto.dni || !dto.tipodDni || !dto.telefono || !dto.residencia){
            throw new BadRequestException('Los datos de la persona son obligatorios')
        }
        const dniExists= await this.peopleRepository.findOne({
            where: { dni: dto.dni }
        })
        if(dniExists){
            throw new BadRequestException('La persona con este DNI ya existe');
        }
        const typeDniExists = await this.typedniService.fyndById(dto.tipodDni);
        if(!typeDniExists){
            throw new BadRequestException('El tipo de DNI no existe');
        };

        const people= new PeopleEntity();
        people.name= dto.name;
        people.lastName= dto.lastName;
        people.birdthDate= dto.birdthDate;
        people.typeDni= typeDniExists;
        people.dni= dto.dni;
        people.residencia= dto.residencia;
        people.telefono= dto.telefono;
        people.supportId= dto.supportId;

        const newPerson= this.peopleRepository.create(people);
        return await this.peopleRepository.save(newPerson);
     
        } catch (error) {
           throw error; 
        }
    }

    async update (idPerson:number, dto: CreatePeopleDto):Promise<PeopleEntity>{
        try {
            const person = await this.peopleRepository.findOne({
                where: { id: idPerson }
            });
            if (!person) {
                throw new BadRequestException('Persona no encontrada');
            }
            this.peopleRepository.merge(person, dto);
            return await this.peopleRepository.save(person);

        } catch (error) {
            throw error;
        }
    }

    async delete(idPerson:number){
        try {
            if(!idPerson){
                throw new BadRequestException('El id de la persona es obligatorio');
            }
            const personExists= await this.peopleRepository.findOne({
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
