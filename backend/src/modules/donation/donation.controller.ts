import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { DonationService } from './donation.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  // get /donation/:id - Obtener una donación por ID
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getDonation(@Param('id') id: number) {
    try {
      const donationId = Number(id);
      return await this.donationService.getDonationById(donationId);
    } catch (error) {
      throw error;
    }
  }

  // post /donation/create - Crear una nueva donación como organizacion
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createDonation(@Body() createDonationDto: CreateDonationDto, @Req() req: any) {
    try {
      const user = req.user;
      return await this.donationService.createDonation(createDonationDto, user);
    } catch (error) {
      throw error;
    }
  }

  // get /donation/me - Obtener donaciones del usuario autenticado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyDonations(@Req() req: any) {
    try {
      const user = req.user;
      return await this.donationService.getUserDonations(user.id);
    } catch (error) {
      throw error;
    }
  }

  // get /donation/users/:idUser - Obtener donaciones de un usuario específico
  @UseGuards(JwtAuthGuard)
  @Get('users/:idUser')
  async getDonationsByUser(@Param('idUser') idUser: number) {
    try {
      const userId = Number(idUser);
      return await this.donationService.getDonationsByUser(userId);
    } catch (error) {
      throw error;
    }
  }

  // post /donation/:id - Actualizar una donación (owner/admin)
  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async updateDonation(@Param('id') id: number, @Body() updateDonationDto: UpdateDonationDto, @Req() req: any) {
    try {
      const donationId = Number(id);
      const user = req.user;
      return await this.donationService.updateDonation(donationId, updateDonationDto, user);
    } catch (error) {
      throw error;
    }
  }

  // Delete /donation/:id - Eliminar una donación (owner con restricción de estado, admin sin restricción)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDonation(@Param('id') id: number, @Req() req: any) {
    try {
      const donationId = Number(id);
      const user = req.user;
      return await this.donationService.deleteDonation(donationId, user);
    } catch (error) {
      throw error;
    }
  }

  // delete /admin/donation/:id - Eliminar donación sin restricción (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  async deleteAdminDonation(@Param('id') id: number) {
    try {
      const donationId = Number(id);
      return await this.donationService.deleteAdminDonation(donationId);
    } catch (error) {
      throw error;
    }
  }

  // post /donation/:id/status - Cambiar estado de donación (owner/admin)
  @UseGuards(JwtAuthGuard)
  @Post(':id/status')
  async updateStatus(@Param('id') id: number, @Body() body: UpdateStatusDto, @Req() req: any) {
    try {
      const user = req.user;
      const donationId = Number(id);
      return await this.donationService.changeStatus(donationId, body.status, user);
    } catch (error) {
      throw error;
    }
  }

  // post /donation/:id/status/admin - Cambiar estado de donación (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/status/admin')
  async updateStatusAdmin(@Param('id') id: number, @Body() body: UpdateStatusDto) {
    try {
      const donationId = Number(id);
      return await this.donationService.changeStatus(donationId, body.status);
    } catch (error) {
      throw error;
    }
  }
}

