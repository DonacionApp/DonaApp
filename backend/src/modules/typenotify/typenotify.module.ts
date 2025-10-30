import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeNotifyEntity } from "./entity/type.notify.entity";
import { TypeNotifyController } from "./typenotify.controller";
import { TypeNotifyService } from "./typenotify.service";

@Module({
   imports: [TypeOrmModule.forFeature([TypeNotifyEntity])],
   controllers: [TypeNotifyController],
   providers: [TypeNotifyService],
   exports: [TypeNotifyService],
})
export class TypeNotifyModule {}