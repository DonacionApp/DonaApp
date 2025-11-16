import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entity/user.entity';
import { Repository, Not, IsNull } from 'typeorm';

@Injectable()
export class StatisticsService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ){}
//metodo para obtener estadisticas de usuarios
    async getUserStatistics(){
        const totalUsers = await this.userRepository.count();
        const verifiedUsers = await this.userRepository.count({where: {verified: true}});
        const unverifiedUsers = totalUsers - verifiedUsers;
        const blockedUsers = await this.userRepository.count({where: {block: true}});
        const unblockedUsers = totalUsers - blockedUsers;
        const usersWithProfilePhoto = await this.userRepository.count({where: {profilePhoto: Not(IsNull())}});

        return {
            totalUsers,
            verifiedUsers,
            unverifiedUsers,
            blockedUsers,
            unblockedUsers,
            usersWithProfilePhoto
        }
    }
}
