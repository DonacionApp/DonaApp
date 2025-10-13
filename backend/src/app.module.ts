import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from './config/constants';

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
      synchronize:false,
      logging:true,
    }),
    inject:[ConfigService]
  })
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
