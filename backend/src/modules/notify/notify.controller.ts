import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { NotifyService } from "./notify.service";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { RolesGuard } from "src/shared/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorators";
import { CreateNotifyDto } from "./dto/create.notify.dto";
import { UpdateNotifyDto } from "./dto/update.notify.dto";
import { NotifyGateway } from "./notify.gateway";

@UsePipes(new ValidationPipe())
@Controller('notify')
export class NotifyController {
   constructor(
      private readonly notifyService: NotifyService,
      private readonly notifyGateway: NotifyGateway,
   ) { }

   @UseGuards(JwtAuthGuard)
   @Get('/all/me')
   async getMyNotifies(@Req() req:any) {
      const userId = req.user.id;
      return await this.notifyService.findByUserId(userId);
   }

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

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Get('user/:userId')
   async getNotifiesByUser(@Param('userId') userId: number) {
      return await this.notifyService.findByUserId(userId);
   }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Post('update/:id')
   async updateNotify(
      @Param('id') id: number,
      @Body() dto: UpdateNotifyDto
   ) {
      return await this.notifyService.updateNotify(id, dto);
   }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Delete('delete/:id')
   async deleteNotify(@Param('id') id: number) {
      return await this.notifyService.deleteNotify(id);
   }

   /**
    * Endpoint para enviar notificación en tiempo real a un usuario específico
    */
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Post('send/:userId')
   async sendNotificationToUser(
      @Param('userId') userId: number,
      @Body() notification: { title: string; message: string; data?: any }
   ) {
      const sent = this.notifyGateway.sendNotificationToUser(+userId, notification);
      return {
         success: sent,
         message: sent 
            ? `Notificación enviada al usuario ${userId}` 
            : `Usuario ${userId} no está conectado`,
         userId: +userId,
         isConnected: this.notifyGateway.isUserConnected(+userId),
      };
   }

   /**
    * Endpoint para enviar notificación a múltiples usuarios
    */
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Post('send/multiple')
   async sendNotificationToMultipleUsers(
      @Body() body: { userIds: number[]; notification: { title: string; message: string; data?: any } }
   ) {
      const results = this.notifyGateway.sendNotificationToUsers(
         body.userIds,
         body.notification
      );
      return {
         success: true,
         ...results,
         message: `Notificación enviada a ${results.sent} usuarios, ${results.failed} no conectados`,
      };
   }

   /**
    * Endpoint para broadcast a todos los usuarios conectados
    */
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Post('broadcast')
   async broadcastNotification(
      @Body() notification: { title: string; message: string; data?: any }
   ) {
      this.notifyGateway.broadcastNotification(notification);
      const connectedUsers = this.notifyGateway.getConnectedUsers();
      return {
         success: true,
         message: `Notificación enviada a ${connectedUsers.length} usuarios conectados`,
         connectedUsers: connectedUsers.length,
      };
   }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Get('connected-users')
   async getConnectedUsers() {
      const connectedUsers = this.notifyGateway.getConnectedUsers();
      return {
         success: true,
         total: connectedUsers.length,
         userIds: connectedUsers,
      };
   }

   @UseGuards(JwtAuthGuard)
   @Get('is-connected/:userId')
   async isUserConnected(@Param('userId') userId: number) {
      const isConnected = this.notifyGateway.isUserConnected(+userId);
      return {
         userId: +userId,
         isConnected,
      };
   }
}