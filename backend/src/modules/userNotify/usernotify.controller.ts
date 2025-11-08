import { BadRequestException, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { UserNotifyService } from "./usernotify.service";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";

@Controller('user-notify')
export class UserNotifyController {
   constructor(
      private readonly userNotifyService: UserNotifyService
   ) { }

   @UseGuards(JwtAuthGuard)
   @Post('my-notifications')
   async getMyNotifications(@Req() req: any) {
      const userFromToken = req && req.user ? req.user : null;
      const userId = userFromToken?.sub ?? userFromToken?.id ?? null;

      if (!userId) {
         throw new BadRequestException('Usuario no identificado');
      }

      return await this.userNotifyService.getMyNotifications(userId);
   }

   @UseGuards(JwtAuthGuard)
   @Get('my-notifications/:notifyId')
   async getMyNotificationById(@Req() req: any, @Param('notifyId') notifyId: number) {
      const userFromToken = req && req.user ? req.user : null;
      const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
      if (!userId) {
         throw new Error('Usuario no identificado');
      }
      return await this.userNotifyService.getMyNotificationById(userId, notifyId);
   }

   @UseGuards(JwtAuthGuard)
   @Put('my-notifications/mark-all-as-read')
   async markAllAsRead(@Req() req: any) {
      const userFromToken = req && req.user ? req.user : null;
      const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
      if (!userId) {
         throw new BadRequestException('Usuario no identificado');
      }
      return await this.userNotifyService.markAllAsRad(userId);
   }

   @UseGuards(JwtAuthGuard)
   @Delete('my-notifications/delete/:notifyId')
   async deleteMyNotification(@Req() req: any, @Param('notifyId') notifyId: number) {
      const userFromToken = req && req.user ? req.user : null;
      const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
      if (!userId) {
         throw new Error('Usuario no identificado');
      }
      return await this.userNotifyService.deleteMyNotification(userId, notifyId);
   }

   @UseGuards(JwtAuthGuard)
   @Patch('my-notifications/mark-as-read/:notifyId')
   async markAsRead(@Req() req: any, @Param('notifyId') notifyId: number) {
      const userFromToken = req && req.user ? req.user : null;
      const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
      if (!userId) {
         throw new BadRequestException('Usuario no identificado');
      }
      return await this.userNotifyService.markAsRead(userId, notifyId);
   }
}