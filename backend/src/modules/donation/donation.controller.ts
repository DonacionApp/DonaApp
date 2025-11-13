import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards, Query } from '@nestjs/common';
import { DonationService } from './donation.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { FilterDonationDto } from './dto/filter-donation.dto';

@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) { }

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
      return await this.donationService.createDonation(createDonationDto, user.id);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-date/:id')
  async updateDonationDate(@Param('id') id: number, @Body() updateDateDto: any, @Req() req: any) {
    try {
      const user = req.user;
      const currentUserId: number = user.id;
      return await this.donationService.incrementDonationDate(id, currentUserId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/update-date/:id')
  async updateDonationDateAdmin(@Param('id') id: number, @Body() updateDateDto: any, @Req() req: any) {
    try {
      const user = req.user;
      const currentUserId: number = user.id;
      return await this.donationService.incrementDonationDate(id, currentUserId);
    } catch (error) {
      throw error;
    }
  }

  // get /donation/me - Obtener donaciones del usuario autenticado
  @UseGuards(JwtAuthGuard)
  @Get('me/all')
  async getMyDonations(@Req() req: any) {
    try {
      const user = req.user;
      return await this.donationService.getUserDonations(user.id, user.id);
    } catch (error) {
      throw error;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('me/made')
  async getMyDonationsMade(@Req() req: any, @Query('limit') limit?: string, @Query('offset') offset?: string, @Query('page') page?: string) {
    try {
      const user = req.user;
      const opts: any = {};
      if (limit) opts.limit = Number(limit);
      if (offset) opts.offset = Number(offset);
      if (page) opts.page = Number(page);
      return await this.donationService.getDonationsMadeByUser(user.id, opts);
    } catch (error) {
      throw error;
    }
  }
  @Get('users/:idUser')
  async getDonationsByUser(
    @Param('idUser') idUser: number,
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
    @Query('role') role?: string, // 'donador' | 'beneficiario' | undefined
    @Query('statusId') statusId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('searchParam') searchParam?: string,
    @Query('typeSearch') typeSearch?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    try {
      const targetUserId = Number(idUser);
      const currentUser = req?.user;
      const opts: any = {};
      if (limit) opts.limit = Number(limit);
      if (offset) opts.offset = Number(offset);
      if (page) opts.page = Number(page);
      if (cursor) opts.cursor = cursor;
      if (role) opts.role = String(role).toLowerCase();
      if (statusId) opts.statusId = Number(statusId);
      if (startDate) opts.startDate = startDate;
      if (endDate) opts.endDate = endDate;
      if (searchParam) opts.searchParam = searchParam;
      if (typeSearch) {
        try {
          opts.typeSearch = JSON.parse(typeSearch);
        } catch (e) {
          // allow comma separated
          opts.typeSearch = String(typeSearch).split(',').map(s => s.trim());
        }
      }
      if (orderBy) opts.orderBy = orderBy;

      return await this.donationService.getDonationsByUser(targetUserId, currentUser?.id, opts);
    } catch (error) {
      throw error;
    }
  }

  // post /donation/:id - Actualizar una donación (owner)
  @UseGuards(JwtAuthGuard)
  @Post('/update/:id')
  async updateDonation(@Param('id') id: number, @Body() updateDonationDto: UpdateDonationDto, @Req() req: any) {
    try {
      const donationId = Number(id);
      const user = req.user;
      return await this.donationService.updateDonation(donationId, updateDonationDto, user);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/update/:id')
  async adminUpdateDonation(@Param('id') id: number, @Req() req: any, @Body() updateDonationDto: UpdateDonationDto): Promise<any> {
    try {
      const user = req.user;
      return await this.donationService.updateDonation(id, updateDonationDto, user, true);
    } catch (error) {
      throw error;
    }
  }

  // Delete /donation/:id - Eliminar una donación (owner con restricción de estado,)
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

  // post /donation/:id/status - Cambiar estado de donación (owner)
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
  async updateStatusAdmin(@Param('id') id: number, @Req() req: any, @Body() body: UpdateStatusDto) {
    try {
      const user = req.user;
      const donationId = Number(id);
      return await this.donationService.changeStatus(donationId, body.status, user, true);
    } catch (error) {
      throw error;
    }
  }

  // get /donation/history/search - Obtener historial de donaciones con filtros (usuario autenticado)
  @UseGuards(JwtAuthGuard)
  @Get('history/search')
  async getDonationHistory(@Req() req: any, @Body() filters: FilterDonationDto) {
    try {
      const user = req.user;
      return await this.donationService.getDonationHistory(user, filters);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/chat/create-from-donation/:donationId')
  async createChatFromDonation(@Param('donationId')donationId:number, @Req() req:any){
    const user=req.user;
    return this.donationService.createChatdonation(donationId, user.id);
  }
}

