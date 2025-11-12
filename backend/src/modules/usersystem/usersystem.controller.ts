import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersystemService } from './usersystem.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('usersystem')
export class UsersystemController {
	constructor(private readonly usersystemService: UsersystemService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
	@Get()
	async findAll(
		@Query('limit') limit?: string,
		@Query('cursor') cursor?: string,
		@Query('search') search?: string,
		@Query('role') role?: string,
	) {
		const params = {
			limit: limit ? Number(limit) : undefined,
			cursor,
			search,
			role,
		};
		return this.usersystemService.getUserSystems(params);
	}
}
