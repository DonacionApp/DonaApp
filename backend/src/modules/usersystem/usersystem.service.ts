import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSystemEntity } from './entity/user.system.entity';
import { Repository, Brackets } from 'typeorm';
import { SystemService } from '../system/system.service';

@Injectable()
export class UsersystemService {
    constructor(
        @InjectRepository(UserSystemEntity)
        private readonly userSystemRepository: Repository<UserSystemEntity>,
        private readonly systemService:SystemService,
    ){}

    async addUserToSystem(userId: number): Promise<UserSystemEntity> {
        if (!userId) throw new BadRequestException('User es necesario');

        const system = await this.systemService.getTermsAndPolicies();

        const userSystemExist = await this.userSystemRepository
            .createQueryBuilder('userSystem')
            .where('userSystem.userId = :userId', { userId })
            .andWhere('userSystem.systemId = :systemId', { systemId: system.id })
            .getOne();

        if (userSystemExist) {
            throw new ConflictException('El usuario ya aceptó los términos y políticas');
        }

        const userSystem = this.userSystemRepository.create({
            user: { id: userId },
            system: system,
        });

        return await this.userSystemRepository.save(userSystem);
    }

    async getUserSystems(params?: { limit?: number; cursor?: string; search?: string; role?: string; }): Promise<{ items: any[]; nextCursor?: string }> {
        const limit = Math.min(params?.limit ?? 20, 100);
        const take = limit + 1; 

        const qb = this.userSystemRepository.createQueryBuilder('us')
            .leftJoin('us.user', 'user')
            .leftJoin('user.people', 'people')
            .leftJoin('user.rol', 'rol')
            .select([
                'us.id AS userSystem_id',
                'us.createdAt AS userSystem_createdAt',
                'user.id AS user_id',
                'user.username AS user_username',
                'user.email AS user_email',
                'user.profilePhoto AS user_profilePhoto',
                'user.createdAt AS user_createdAt',
                'people.id AS people_id',
                'people.name AS people_name',
                'people.lastName AS people_lastName',
                'rol.id AS rol_id',
                'rol.rol AS rol_name',
            ])
            .orderBy('us.createdAt', 'DESC')
            .addOrderBy('us.id', 'DESC')
            .take(take);

        if (params?.search) {
            const search = `%${params.search.toLowerCase()}%`;
            qb.andWhere(new Brackets(q => {
                q.where('LOWER(user.username) LIKE :search', { search })
                    .orWhere('LOWER(people.name) LIKE :search', { search })
                    .orWhere('LOWER(people.lastName) LIKE :search', { search });
            }));
        }

        if (params?.role) {
            qb.andWhere('rol.rol = :role', { role: params.role });
        }

        if (params?.cursor) {
            const parts = params.cursor.split('_');
            const cursorDate = new Date(parts[0]);
            const cursorId = parts[1] ? Number(parts[1]) : 0;

            qb.andWhere(new Brackets(q => {
                q.where('us.createdAt < :cursorDate', { cursorDate })
                    .orWhere('us.createdAt = :cursorDate AND us.id < :cursorId', { cursorDate, cursorId });
            }));
        }

        const raws = await qb.getRawMany();

        let nextCursor: string | undefined = undefined;
        let rows = raws;
        if (raws.length > limit) {
            const next = raws[limit];
            const nextDate = new Date(next['userSystem_createdAt']).toISOString();
            const nextId = next['userSystem_id'];
            nextCursor = `${nextDate}_${nextId}`;
            rows = raws.slice(0, limit);
        }

        const items = rows.map(r => ({
            userSystemId: r['userSystem_id'],
            acceptedAt: r['userSystem_createdAt'],
            user: {
                id: r['user_id'],
                username: r['user_username'],
                email: r['user_email'],
                profilePhoto: r['user_profilePhoto'],
                createdAt: r['user_createdAt'],
            },
            people: r['people_id'] ? {
                id: r['people_id'],
                name: r['people_name'],
                lastName: r['people_lastName'],
            } : null,
            role: r['rol_id'] ? { id: r['rol_id'], name: r['rol_name'] } : null,
        }));

        return { items, nextCursor };
    }
}
