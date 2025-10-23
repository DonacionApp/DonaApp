import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { RolEntity } from '../rol/entity/rol.entity';
import { PeopleEntity } from '../people/entity/people.entity';
import { PeopleService } from '../people/people.service';
import { RolService } from '../rol/rol.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
    @InjectRepository(PeopleEntity)
    private readonly peopleRepository: Repository<PeopleEntity>,
    private readonly peopleService: PeopleService,
    private readonly rolService: RolService
  ) {}

  async findAll(): Promise<UserEntity[]> {
    try {
      const users = await this.userRepository.find({ relations: {
        rol:true,
        people:{
          typeDni:true
        }
      }});
      if (!users || users.length === 0) {
        throw new BadRequestException('No hay usuarios registrados');
      }
      return users;
    } catch (error) {
      throw error;
    }
  }

  async fyndByEmail(email: string): Promise<UserEntity> {
    try {
      if(!email)throw new BadRequestException('El email es obligatorio');
      const user = await this.userRepository.findOne({
        where:{email:email},
        relations:{
          people:{
            typeDni:true
          },
          rol:true
        }
      });
      if(!user)throw new NotFoundException('Usuario no encontrado');
      return user;
    }catch(error){
      throw error;
    }
  }


  async findById(id: number): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations:{
          people:{
            typeDni:true
          },
          rol:true
        }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findByUsername(username: string): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { username }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    try {
      if (!dto.username || !dto.email || !dto.password || !dto.rolId || !dto.people) {
        throw new BadRequestException('Los datos del usuario son obligatorios');
      }

      dto.username = dto.username.trim();
      dto.email = dto.email.trim().toLowerCase();

      const usernameExists = await this.userRepository.findOne({
        where: { username: dto.username }
      });
      if (usernameExists) {
        throw new BadRequestException('El username ya existe');
      }

      const emailExists = await this.userRepository.findOne({
        where: { email: dto.email }
      });
      if (emailExists) {
        throw new BadRequestException('El email ya existe');
      }
      const rol = await this.rolService.findById(dto.rolId);
      if (!rol) {
        throw new BadRequestException('El rol no existe');
      }
      const people = await this.peopleService.create(dto.people)

      const user = new UserEntity();
      user.username = dto.username;
      user.email = dto.email;
      user.password = dto.password;
      user.rol = rol;
      user.people = people;
      if (dto.profilePhoto !== undefined) {
        user.profilePhoto = dto.profilePhoto;
      }
      if (dto.block !== undefined) user.block = dto.block;

      const newUser = this.userRepository.create(user);
      return await this.userRepository.save(newUser);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, dto: UpdateUserDto, resetPass?:boolean): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      const targetUsername = dto.username?.trim();
      const targetEmail = dto.email?.trim().toLowerCase();

      if (targetUsername !== user.username && targetUsername) {
        const usernameExists = await this.userRepository.findOne({
          where: { username: targetUsername }
        });
        if (usernameExists) {
          throw new BadRequestException('El username ya existe');
        }
        user.username = targetUsername;
      }

      if (targetEmail !== user.email && targetEmail) {
        const emailExists = await this.userRepository.findOne({
          where: { email: targetEmail }
        });
        if (emailExists) {
          throw new BadRequestException('El email ya existe');
        }
        user.email = targetEmail;
      }

      if (dto.password) {
        user.password = dto.password;
      }
      if(dto.token){
        user.token=dto.token;
      }
      if(dto.verificationCode){
        user.code=dto.verificationCode;
      }
      if(dto.verified!==undefined){
        user.verified=dto.verified;
      }
      if(dto.isVerifiedEmail){
        user.emailVerified=dto.isVerifiedEmail;
        if(dto.isVerifiedEmail===true){
          user.code=null;
          user.token=null;
          user.dateSendCodigo=null;

        }
      }
      if(resetPass){
        user.code=null;
        user.token=null;
        user.dateSendCodigo=null;
      }
      if(dto.code){
        user.code=dto.code;
      }
      if(dto.dateSendCodigo){
        user.dateSendCodigo=dto.dateSendCodigo;
      }

      if (dto.rolId && dto.rolId !== user.rol?.id) {
        const rol = await this.rolService.findById(dto.rolId)
        if (!rol) {
          throw new BadRequestException('El rol no existe');
        }
        if(user.rol.rol=='admin' && rol.rol!='admin'){
          const adminCount = await this.countUsersAdmins();
          if(adminCount<=1){
            throw new BadRequestException('No se puede cambiar el rol. Debe haber al menos un usuario con rol de admin');
          }
        }
        user.rol = rol;
      }

      if (dto.people &&dto.people?.id!==null && dto.people?.id && dto.people?.id !== user.people?.id && typeof(dto.people?.id)!=='undefined') {
        const people = await this.peopleService.findById(dto.people.id)
        if (!people) {
          throw new BadRequestException('La persona no existe');
        }
        user.people = people;
      }

      if (dto.profilePhoto !== undefined) user.profilePhoto = dto.profilePhoto;
      if (dto.block !== undefined) user.block = dto.block;

      return await this.userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('El id del usuario es obligatorio');
      }
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations:{
          people:{
            typeDni:true
          },
          rol:true
        }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      await this.userRepository.delete(id);
      await this.peopleService.delete(user.people.id)
      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw error;
    }
  }

    async countUsersAdmins():Promise<number>{
    try {
      const count = await this.userRepository.count({
        where: { rol: { rol: 'admin' } }
      });
      return count;
    } catch (error) {
      throw error;
    }
  }

  async changeRole(userId:number, rolId:number):Promise<UserEntity>{
    try {
      if(!userId){
        throw new BadRequestException('El id del usuario es obligatorio');
      }
      if(!rolId){
        throw new BadRequestException('El id del rol es obligatorio');
      }
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      const rol = await this.rolService.findById(rolId);
      if (!rol) {
        throw new BadRequestException('Rol no encontrado');
      }
      if(user.rol.rol=='admin' && rol.rol!='admin'){
        const adminCount = await this.countUsersAdmins();
        if(adminCount<=1){
          throw new BadRequestException('No se puede cambiar el rol. Debe haber al menos un usuario con rol de admin');
        }
      }
      user.rol = rol;
      return await this.userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  async changeBlockStatus(userId:number, blockStatus:boolean):Promise<UserEntity>{
    try {
      if(!userId){
        throw new BadRequestException('El id del usuario es obligatorio');
      }
      if(blockStatus===undefined || blockStatus===null){
        throw new BadRequestException('El estado de bloqueo es obligatorio');
      }
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      user.block = blockStatus;
      return await this.userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }
}
