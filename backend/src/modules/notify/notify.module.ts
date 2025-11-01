import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotifyEntity } from "./entity/notify.entity";
import { TypeNotifyModule } from "../typenotify/typenotify.module";
import { NotifyService } from "./notify.service";
import { NotifyController } from "./notify.controller";
import { UserNotifyModule } from "../userNotify/usernotify.module";

@Module({
   imports: [
      TypeOrmModule.forFeature([NotifyEntity]),
      TypeNotifyModule,
      UserNotifyModule,
   ],
   providers: [NotifyService],
   controllers: [NotifyController],
   exports: [NotifyService],
})
export class NotifyModule {}