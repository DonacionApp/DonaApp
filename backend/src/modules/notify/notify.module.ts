import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotifyEntity } from "./entity/notify.entity";
import { TypeNotifyModule } from "../typenotify/typenotify.module";
import { NotifyService } from "./notify.service";
import { NotifyController } from "./notify.controller";
import { UserNotifyModule } from "../userNotify/usernotify.module";
import { UserModule } from "../user/user.module";

@Module({
   imports: [
      TypeOrmModule.forFeature([NotifyEntity]),
      TypeNotifyModule,
      forwardRef(() => UserNotifyModule),
      UserModule,
   ],
   providers: [NotifyService],
   controllers: [NotifyController],
   exports: [NotifyService],
})
export class NotifyModule {}