import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationReviewEntity } from './entity/donation.review.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DonationreviewService {
    constructor(
        @InjectRepository(DonationReviewEntity)
        private readonly donationReviewRepository: Repository<DonationReviewEntity>,
    ){}
}
