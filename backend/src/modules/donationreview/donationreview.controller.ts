import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DonationreviewService } from './donationreview.service';
import { CreateReviewDto } from './dto/create.review.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('donationreview')
export class DonationreviewController {
	constructor(
		private readonly donationReviewService: DonationreviewService,
	) {}

	@Get('/donation/:id')
	async getByDonation(@Param('id') id: number) {
		return this.donationReviewService.getReviewsByDonationId(Number(id));
	}

	@UseGuards(JwtAuthGuard)
	@Post('/create')
	async createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
		const userId = req.user?.id;
		if (!userId) throw new Error('usuario invalido');
		return this.donationReviewService.createReview(Number(userId), dto);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('/update/:id')
	async updateReview(@Req() req: any, @Param('id') id: number, @Body() body:{newReview: string}) {
		const userId = req.user?.id;
		if (!userId) throw new Error('usuario invalido');
		return this.donationReviewService.updateReviewById(Number(id), Number(userId), String(body.newReview));
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/delete/:id')
	async deleteReview(@Req() req: any, @Param('id') id: number) {
		const userId = req.user?.id;
		if (!userId) throw new Error('usuario invalido');
		return this.donationReviewService.deleteReviewById(Number(id), Number(userId));
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Get('/all')
	async getAll() {
		return this.donationReviewService.getAllReviews();
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Delete('/admin/delete/:id')
	async deleteByAdmin(@Req() req: any, @Param('id') id: number) {
		const userId = req.user?.id;
		if (!userId) throw new Error('usuario invalido');
		return this.donationReviewService.deleteReviewById(Number(id), Number(userId), true);
	}
}
