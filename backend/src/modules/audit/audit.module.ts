import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEntity } from './entity/audit.entity';
import { UserEntity } from '../user/entity/user.entity';

@Injectable()
export class AuditService {
  // add service methods here as needed
}

@Module({
  imports: [TypeOrmModule.forFeature([AuditEntity, UserEntity])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
