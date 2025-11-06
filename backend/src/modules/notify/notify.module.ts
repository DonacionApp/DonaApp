import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotifyEntity } from "./entity/notify.entity";
import { TypeNotifyModule } from "../typenotify/typenotify.module";
import { NotifyService } from "./notify.service";
import { NotifyController } from "./notify.controller";
import { UserNotifyModule } from "../userNotify/usernotify.module";
import { UserModule } from "../user/user.module";
import { NotifyGateway } from './notify.gateway';
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
   imports: [
      TypeOrmModule.forFeature([NotifyEntity]),
      TypeNotifyModule,
      forwardRef(() => UserNotifyModule),
      UserModule,
      JwtModule.registerAsync({
         imports: [ConfigModule],
         useFactory: async (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET'),
            signOptions: { expiresIn: '1d' },
         }),
         inject: [ConfigService],
      }),
      ConfigModule,
   ],
   providers: [NotifyService, NotifyGateway],
   controllers: [NotifyController],
   exports: [NotifyService, NotifyGateway],
})
export class NotifyModule {}