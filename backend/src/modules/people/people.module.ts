import { Module } from '@nestjs/common';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleEntity } from './entity/people.entity';
import { TypedniModule } from '../typedni/typedni.module';

@Module({
  imports:[TypeOrmModule.forFeature([PeopleEntity]),TypedniModule
   ],
  controllers: [PeopleController],
  providers: [PeopleService]
})
export class PeopleModule {}
