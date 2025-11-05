import { Body, Controller, Param, Post } from '@nestjs/common';
import { PostdonationarticleService } from './postdonationarticle.service';
import { FilterSearchPostDonationArticleDto } from './dto/filter.search.dto';

@Controller('postdonationarticle')
export class PostdonationarticleController {
    constructor(
        private readonly postDonationArticleService:PostdonationarticleService,
    ){}

    @Post('/all/post/:id')
   async getAllArticlesFromDonation(@Param('id') id: number, @Body() filter: FilterSearchPostDonationArticleDto): Promise<any> {
       return await this.postDonationArticleService.getAllArticlesFromDonation({ ...filter, donationId: id });
   }
}
