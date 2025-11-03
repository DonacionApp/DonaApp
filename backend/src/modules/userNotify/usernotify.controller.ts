import { BadRequestException, Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { UserNotifyService } from "./usernotify.service";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";

@Controller('user-notify')
export class UserNotifyController {
   constructor(
      private readonly userNotifyService: UserNotifyService
   ) { }

   @UseGuards(JwtAuthGuard)
   @Get('my-notifications')
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
}