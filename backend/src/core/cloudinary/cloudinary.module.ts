import { Module } from '@nestjs/common';
import { ClodinaryController } from './cloudinary.controller';
import { ClodinaryService } from './cloudinary.service';

@Module({
  controllers: [ClodinaryController],
  providers: [ClodinaryService]
})
export class ClodinaryModule {}
