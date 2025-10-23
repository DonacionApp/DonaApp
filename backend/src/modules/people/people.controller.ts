import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePeopleDto } from './dto/create.people.dto';

@Controller('people')
export class PeopleController {
}
