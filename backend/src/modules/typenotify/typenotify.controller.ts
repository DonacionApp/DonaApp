import { Controller, Get } from "@nestjs/common";
import { TypeNotifyService } from "./typenotify.service";

@Controller('type-notify')
export class TypeNotifyController {
   constructor (
      private readonly typeNotifyService: TypeNotifyService,
   ) {}

   @Get()
   async getAllTypeNotifies() {
      try {
         return await this.typeNotifyService.getAllTypeNotifies();
      } catch (error) {
         throw error;
      }
   }
}