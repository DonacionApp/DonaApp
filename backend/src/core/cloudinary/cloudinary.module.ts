import { Module } from '@nestjs/common';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME } from 'src/config/constants';

@Module({
  imports: [ConfigModule],
  controllers: [CloudinaryController],
  providers: [CloudinaryService,
    {
      provide: 'CLOUDINARY',
      inject:[ConfigService],
      useFactory:(configService:ConfigService)=>{
        return cloudinary.config({
          cloud_name: configService.get<string>(CLOUDINARY_NAME),
          api_key: configService.get<string>(CLOUDINARY_API_KEY),
          api_secret: configService.get<string>(CLOUDINARY_API_SECRET),
        })
      }
    }
  ]
})
export class CloudinaryModule {}
