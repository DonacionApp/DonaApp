import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from './config/constants';
import { SederServiceModule } from './config/seder-service/seder-service.module';
import { TypedniModule } from './modules/typedni/typedni.module';
import { RolModule } from './modules/rol/rol.module';
import { PeopleModule } from './modules/people/people.module';
import { UserModule } from './modules/user/user.module';
import { MailModule } from './core/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { CountriesModule } from './modules/countries/countries.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';
import { TagsModule } from './modules/tags/tags.module';
import { TypepostModule } from './modules/typepost/typepost.module';
import { TypeNotifyModule } from './modules/typenotify/typenotify.module';
import { PosttagsModule } from './modules/posttags/posttags.module';
import { ImagepostModule } from './modules/imagepost/imagepost.module';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: '.env',
    isGlobal:true
  }),
  TypeOrmModule.forRootAsync({
    imports:[ConfigModule],
    useFactory:(configService: ConfigService)=>({
      type:'postgres',
      host: configService.get(DB_HOST),
      port: configService.get<number>(DB_PORT),
      username: configService.get(DB_USER),
      password: configService.get(DB_PASS),
      database: configService.get(DB_NAME),
      entities: [__dirname+'/**/*.entity{.ts,.js}'],
      synchronize:true,
      logging:false,
    }),
    inject:[ConfigService]
  }),
  SederServiceModule,
  TypedniModule,
  PeopleModule,
  RolModule,
  UserModule,
  MailModule,
  AuthModule,
  CountriesModule,
  CloudinaryModule,
  TagsModule,
  TypepostModule,
  TypeNotifyModule,
  PosttagsModule,
  ImagepostModule,
  PostModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
