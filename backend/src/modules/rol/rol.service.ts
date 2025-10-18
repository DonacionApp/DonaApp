import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from './entity/rol.entity';
import { CreateRolDto } from './dto/create.rol.dto';
import { UpdateRolDto } from './dto/update.rol.dto';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
  ) {}

  async findAll(): Promise<RolEntity[]> {
    const roles = await this.rolRepository.find();
    if (!roles || roles.length === 0) {
      throw new BadRequestException('No hay roles registrados');
    }
    return roles;
  }

  async findById(id: number): Promise<RolEntity> {
    const rol = await this.rolRepository.findOne({ where: { id } });
    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }
    return rol;
  }

  async findByName(rol: string): Promise<RolEntity> {
    const rolFound = await this.rolRepository.findOne({ where: { rol: rol.toUpperCase().trim() } });
    if (!rolFound) {
      throw new NotFoundException('Rol no encontrado');
    }
    return rolFound;
  }

  async create(dto: CreateRolDto): Promise<RolEntity> {
    if (!dto.rol) {
      throw new BadRequestException('El nombre del rol es obligatorio');
    }
    dto.rol = dto.rol.toUpperCase().trim();
    const exists = await this.rolRepository.findOne({ where: { rol: dto.rol } });
    if (exists) {
      throw new BadRequestException('El rol ya existe');
    }
    const newRol = this.rolRepository.create(dto);
    return await this.rolRepository.save(newRol);
  }

  async update(id: number, dto: UpdateRolDto): Promise<RolEntity> {
    if (!id) {
      throw new BadRequestException('El id del rol es obligatorio');
    }
    dto.rol = dto.rol.toUpperCase().trim();
    const rolEntity = await this.findById(id);
    if (dto.rol === rolEntity.rol) {
      throw new BadRequestException('No se realizaron cambios en el rol');
    }
    const nameExists = await this.rolRepository.findOne({ where: { rol: dto.rol } });
    if (nameExists) {
      throw new BadRequestException('El rol ya existe');
    }
    rolEntity.rol = dto.rol;
    return await this.rolRepository.save(rolEntity);
  }

  async delete(id: number): Promise<any> {
    if (!id) {
      throw new BadRequestException('El id del rol es obligatorio');
    }
    const rolEntity = await this.findById(id);
    await this.rolRepository.delete(id);
    return { message: 'Rol eliminado correctamente' };
  }
}
