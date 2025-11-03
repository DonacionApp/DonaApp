import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserNotifyEntity } from "./entity/user.notify.entity";
import { UserModule } from "../user/user.module";
import { UserNotifyService } from "./usernotify.service";
import { UserNotifyController } from "./usernotify.controller";
import { NotifyModule } from "../notify/notify.module";

@Module({
   imports: [
      TypeOrmModule.forFeature([UserNotifyEntity]),
      UserModule,
      forwardRef(() => NotifyModule),
   ],
   providers: [UserNotifyService],
   controllers: [UserNotifyController],
   exports: [UserNotifyService],
})
export class UserNotifyModule {}