import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RolEntity } from '../rol/entity/rol.entity';
import { PeopleEntity } from '../people/entity/people.entity';
import { RolModule } from '../rol/rol.module';
import { PeopleModule } from '../people/people.module';
import { CountriesModule } from '../countries/countries.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from 'src/core/cloudinary/cloudinary.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RolEntity, PeopleEntity]),RolModule, PeopleModule, CountriesModule, ConfigModule,
forwardRef(() => CloudinaryModule), forwardRef(() => NotifyModule), TypeNotifyModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
