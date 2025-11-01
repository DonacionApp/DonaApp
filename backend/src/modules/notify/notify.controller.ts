import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { NotifyService } from "./notify.service";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { RolesGuard } from "src/shared/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorators";
import { CreateNotifyDto } from "./dto/create.notify.dto";

@UsePipes(new ValidationPipe())
@Controller('notify')
export class NotifyController {
   constructor(
      private readonly notifyService: NotifyService,
   ) { }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Post('create')
   async createNotify(@Body() dto: CreateNotifyDto) {
      return await this.notifyService.createNotify(dto);
   }
}