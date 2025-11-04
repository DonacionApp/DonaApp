import { Controller } from '@nestjs/common';
import { PostarticleService } from './postarticle.service';

@Controller('postarticle')
export class PostarticleController {
    constructor(
        private readonly postArticleService:PostarticleService
    ){}
}
