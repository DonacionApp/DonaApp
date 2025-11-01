import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotifyEntity } from "./entity/notify.entity";
import { TypeNotifyModule } from "../typenotify/typenotify.module";
import { NotifyService } from "./notify.service";
import { NotifyController } from "./notify.controller";

@Module({
   imports: [
      TypeOrmModule.forFeature([NotifyEntity]),
      TypeNotifyModule,
   ],
   providers: [NotifyService],
   controllers: [NotifyController],
   exports: [NotifyService],
})
export class NotifyModule {}