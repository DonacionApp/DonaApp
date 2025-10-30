import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { DonationService } from './donation.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('api/articles')
export class DonationController{
  constructor(private readonly donationService: DonationService){}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: number, @Body() body: UpdateStatusDto, @Req() req:any){
    try{
      const user = req.user;
      const donationId = Number(id);
      return await this.donationService.changeStatus(donationId, body.status, user);
    }catch(error){
      throw error;
    }
  }

}
