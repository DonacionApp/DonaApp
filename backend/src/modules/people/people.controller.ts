import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePeopleDto } from './dto/create.people.dto';

@Controller('people')
export class PeopleController {
	constructor(private readonly peopleService: PeopleService) {}

	@Get()
	async findAll() {
		return await this.peopleService.findAll();
	}

	@Get(':idPerson')
	async findById(@Param('idPerson') idPerson: number) {
		return await this.peopleService.findById(Number(idPerson));
	}

	@Post()
	async create(@Body() dto: CreatePeopleDto) {
		try {
			
		return await this.peopleService.create(dto);
		} catch (error) {
			throw error;
		}
	}

	@Post('update/:idPerson')
	async update(
		@Param('idPerson') idPerson: number,
		@Body() dto: CreatePeopleDto,
	) {
		return await this.peopleService.update(Number(idPerson), dto);
	}

    @Delete(':idPerson')
	async deleteByParam(@Param('idPerson') idPerson: number) {
	return await this.peopleService.delete(Number(idPerson));
 }
}
