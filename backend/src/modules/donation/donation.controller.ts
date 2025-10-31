import { Body, Controller, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { DonationService } from './donation.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Controller('donations')
export class DonationController{
  constructor(private readonly donationService: DonationService){}

  @UseGuards(JwtAuthGuard)
  @Post(':id/status')
  async updateStatus(@Param('id') id: number, @Body() body: UpdateStatusDto, @Req() req:any){
    try{
      const user = req.user;
      const donationId = Number(id);
      return await this.donationService.changeStatus(donationId, body.status, user);
    }catch(error){
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Post(':id/status/admin')
  async updateStatusAdmin(@Param('id') id: number, @Body() body: UpdateStatusDto){
    try{
      const donationId = Number(id);
      return await this.donationService.changeStatus(donationId, body.status);
    }catch(error){
      throw error;
    }
  }


}
