import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PostdonationarticleService } from './postdonationarticle.service';
import { FilterSearchPostDonationArticleDto } from './dto/filter.search.dto';
import { AddArticleToDonationFromPost } from './dto/add.aticle.to.donation.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('postdonationarticle')
export class PostdonationarticleController {
    constructor(
        private readonly postDonationArticleService: PostdonationarticleService,
    ) { }

    @Post('/all/post/:id')
    async getAllArticlesFromDonation(@Param('id') id: number, @Body() filter: FilterSearchPostDonationArticleDto): Promise<any> {
        return await this.postDonationArticleService.getAllArticlesFromDonation({ ...filter, donationId: id });
    }

    @UseGuards(JwtAuthGuard)
    @Post('/add/Article')
    async addArticleToDonation(@Body() dto: AddArticleToDonationFromPost, @Req() user: any): Promise<any> {
        const userFromToken = user && user.user ? user.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new Error('Usuario no identificado');
        return await this.postDonationArticleService.addArticleToDonationFromPost(dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('remove/article/:id')
    async removeArticleFromDonation(@Param('id') id: number, @Req() user: any): Promise<any> {
        const userFromToken = user && user.user ? user.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new Error('Usuario no identificado');
        return await this.postDonationArticleService.removeArticleFromDonationFromPost(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update/quantity/article/')
    async updateQuantityArticleFromDonation(@Body() dto: { postDonationArticleId: number, newQuantity: number }, @Req() user: any): Promise<any> {
        const userFromToken = user && user.user ? user.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new Error('Usuario no identificado');
        return await this.postDonationArticleService.modifyQuantityInPostDonationArticle(dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update/quantity/admin/article/')
    async updateQuantityArticleFromDonationAdmin(@Body() dto: { postDonationArticleId: number, newQuantity: number }, @Req() user: any): Promise<any> {
        const userFromToken = user && user.user ? user.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new Error('Usuario no identificado');
        return await this.postDonationArticleService.modifyQuantityInPostDonationArticle(dto, userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('remove/admin/article/:id')
    async removeArticleFromDonationAdmin(@Param('id') id: number, @Req() user: any): Promise<any> {
        const userFromToken = user && user.user ? user.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new Error('Usuario no identificado');
        return await this.postDonationArticleService.removeArticleFromDonationFromPost(id, userId);
    }
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/add/admin/Article')
    async addArticleToDonationAdmin(@Body() dto: AddArticleToDonationFromPost, @Req() user: any): Promise<any> {
        const userFromToken = user && user.user ? user.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new Error('Usuario no identificado');
        return await this.postDonationArticleService.addArticleToDonationFromPost(dto, userId, true);
    }

}
