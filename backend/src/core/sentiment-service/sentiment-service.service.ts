import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MICROSERVICONSENTIMENTS_URL, MICROSERVICONSENTIMENTS_URL_AUX } from 'src/config/constants';
import { SentimentResponseType } from './dto/response.sentiment.type';

@Injectable()
export class SentimentServiceService {
    constructor(
        private readonly configService: ConfigService,
    ){}

    async analyzeSentiment(text: string): Promise<SentimentResponseType> {
        const apiUrl = this.configService.get<string>(MICROSERVICONSENTIMENTS_URL);
        const apiUrlAux= this.configService.get<string>(MICROSERVICONSENTIMENTS_URL_AUX);
        let url:string;

        if (!apiUrl) {
            if(!apiUrlAux){
                throw new InternalServerErrorException('el analizis de sentimientos no esta disponible en este momento');
            }
            url=apiUrlAux;
        } else {
            url=apiUrl;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"review_text": text }),
        });
        console.log('Sentiment analysis response status:', response);
        const data = await response.json();
        return data as SentimentResponseType;
    }
}
