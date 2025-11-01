import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
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

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Get('id/:id')
   async getNotifyById(@Param('id') id: number) {
      return await this.notifyService.findById(id);
   }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Get('all')
   async getAllNotifies() {
      return await this.notifyService.findAllNotifies();
   }
}