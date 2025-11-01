import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserNotifyEntity } from "./entity/user.notify.entity";
import { UserModule } from "../user/user.module";
import { UserNotifyService } from "./usernotify.service";
import { UserNotifyController } from "./usernotify.controller";

@Module({
   imports: [
      TypeOrmModule.forFeature([UserNotifyEntity]),
      UserModule,
   ],
   providers: [UserNotifyService],
   controllers: [UserNotifyController],
   exports: [UserNotifyService],
})
export class UserNotifyModule {}