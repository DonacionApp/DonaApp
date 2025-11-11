import { Module } from '@nestjs/common';
import { SentimentServiceController } from './sentiment-service.controller';
import { SentimentServiceService } from './sentiment-service.service';

@Module({
  controllers: [SentimentServiceController],
  providers: [SentimentServiceService],
  exports: [SentimentServiceService]
})
export class SentimentServiceModule {}
