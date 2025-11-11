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
import { DonationModule } from './modules/donation/donation.module';
import { EventsModule } from './core/events/events.module';
import { StatusdonationModule } from './modules/statusdonation/statusdonation.module';
import { PostlikedModule } from './modules/postLiked/postliked.module';
import { NotifyModule } from './modules/notify/notify.module';
import { UserNotifyModule } from './modules/userNotify/usernotify.module';
import { IaModule } from './core/ia/ia.module';
import { ArticleModule } from './modules/article/article.module';
import { UserarticleModule } from './modules/userarticle/userarticle.module';
import { PostdonationarticleModule } from './modules/postdonationarticle/postdonationarticle.module';
import { PostarticleModule } from './modules/postarticle/postarticle.module';
import { StatusarticledonationModule } from './modules/statusarticledonation/statusarticledonation.module';
import { StatussupportidModule } from './modules/statussupportid/statussupportid.module';
import { CommentsupportidModule } from './modules/commentSupportId/commentsupportid.module';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from './modules/user/entity/user.entity';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RefreshTokenMiddleware } from './shared/middleware/refresh-token.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AddRefreshTokenInterceptor } from './shared/interceptors/add-refresh-token.interceptor';
import { DonationreviewModule } from './modules/donationreview/donationreview.module';
import { SentimentServiceModule } from './core/sentiment-service/sentiment-service.module';

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
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET'),
      signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
    }),
    global: true,
  }),
  TypeOrmModule.forFeature([UserEntity]),
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
  DonationModule,
  EventsModule,
  StatusdonationModule,
  PostlikedModule,
  NotifyModule,
  UserNotifyModule,
  IaModule,
  ArticleModule,
  UserarticleModule,
  PostdonationarticleModule,
  PostarticleModule,
  StatusarticledonationModule,
  StatussupportidModule,
  CommentsupportidModule,
  DonationreviewModule,
  SentimentServiceModule,
],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AddRefreshTokenInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RefreshTokenMiddleware)
      .forRoutes('*');
  }
}
