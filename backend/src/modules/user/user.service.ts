import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { RolEntity } from '../rol/entity/rol.entity';
import { PeopleEntity } from '../people/entity/people.entity';
import { PeopleService } from '../people/people.service';
import { RolService } from '../rol/rol.service';
import { json } from 'stream/consumers';
import { CountriesService } from '../countries/countries.service';
import { MailService } from 'src/core/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { CLOUDINARY_FOLDER_BASE, CLOUDINARY_PROFILE_FOLDER } from 'src/config/constants';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';

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
    private readonly rolService: RolService,
    private readonly countriesService: CountriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) { }

  async findAll(): Promise<Omit<UserEntity, 'password'>[]> {
    try {
      const users = await this.userRepository.find({
        relations: {
          rol: true,
          people: {
            typeDni: true
          }
        }
      });
      if (!users || users.length === 0) {
        throw new BadRequestException('No hay usuarios registrados');
      }
      //funcionalidad para eliminar las passwords de la respuesta
      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      return usersWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  async fyndByEmail(email: string): Promise<UserEntity> {
    try {
      if (!email) throw new BadRequestException('El email es obligatorio');
      const user = await this.userRepository.findOne({
        where: { email: email },
        relations: {
          people: {
            typeDni: true
          },
          rol: true
        }
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async normalizeMunicipio(municiosJsonstring: string): Promise<{ countryExist: any, stateExist: any, citiExist: any, municipioJson: any }> {
    try {

      const municipioJson = JSON.parse(municiosJsonstring || 'null');
      const country = municipioJson ? municipioJson.pais : null;
      const state = municipioJson ? municipioJson.state : null;
      const city = municipioJson ? municipioJson.city : null;
      const countryExist = await this.countriesService.getCountryByCode(country.iso2);
      const stateExist = await this.countriesService.getStateBycode(state.iso2, country.iso2);
      const citiExist = await this.countriesService.getCityByName(city.name, state.iso2, country.iso2);
      return { countryExist, stateExist, citiExist, municipioJson };
    } catch (error) {
      throw error;
    }
  }


  async findById(id: number): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations: {
          people: {
            typeDni: true
          },
          rol: true
        }
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      const { password, ...userWithoutPassword } = user as any;

      if (user.people.municipio) {
        const { countryExist, stateExist, citiExist, municipioJson } = await this.normalizeMunicipio(user.people.municipio as any);

        userWithoutPassword.people.municipio = {
          country: countryExist, state: stateExist, city: citiExist
        }
      }

      return userWithoutPassword;
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
      const { password, ...userWithoutPassword } = user as any;
      if (user.people.municipio) {
        const { countryExist, stateExist, citiExist, municipioJson } = await this.normalizeMunicipio(user.people.municipio as any);

        userWithoutPassword.municipio = {
          country: countryExist, state: stateExist, city: citiExist
        }
      }



      return userWithoutPassword;
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

  async update(id: number, dto: UpdateUserDto, resetPass?: boolean, file?: Express.Multer.File): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations: {
          people: {
            typeDni: true
          },
          rol: true
        }
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
          where: {
            email: targetEmail,
            id: Not(id)
          }
        });
        if (emailExists) {
          throw new BadRequestException('El email ya existe');
        }
        user.email = targetEmail;
      }

      if (dto.password) {
        user.password = dto.password;
      }
      if (dto.token) {
        user.token = dto.token;
      }
      if (dto.verificationCode) {
        user.code = dto.verificationCode;
      }
      if (dto.verified !== undefined) {
        user.verified = dto.verified;
      }
      if (dto.isVerifiedEmail) {
        user.emailVerified = dto.isVerifiedEmail;
        if (dto.isVerifiedEmail === true) {
          user.code = null;
          user.token = null;
          user.dateSendCodigo = null;

        }
      }
      if (resetPass) {
        user.code = null;
        user.token = null;
        user.dateSendCodigo = null;
      }
      if (dto.code) {
        user.code = dto.code;
      }
      if (dto.dateSendCodigo) {
        user.dateSendCodigo = dto.dateSendCodigo;
      }

      if (dto.rolId && dto.rolId !== user.rol?.id) {
        const rol = await this.rolService.findById(dto.rolId)
        if (!rol) {
          throw new BadRequestException('El rol no existe');
        }
        if (user.rol.rol == 'admin' && rol.rol != 'admin') {
          const adminCount = await this.countUsersAdmins();
          if (adminCount <= 1) {
            throw new BadRequestException('No se puede cambiar el rol. Debe haber al menos un usuario con rol de admin');
          }
        }
        user.rol = rol;
      }

      if (dto.people) {
        const people = await this.peopleService.findById(user.people.id)
        if (!people) {
          throw new BadRequestException('La persona no existe');
        }
        const peopleSaved = await this.peopleService.update(people.id, dto.people);
        user.people = peopleSaved;
      }
      if(file){
        console.log('Archivo recibido en user service:');
      }

      const usuario = await this.userRepository.save(user);

      const { password, ...userWithoutPassword } = usuario as any;
      if (usuario.people.municipio) {
        const municipio = usuario.people.municipio;
        const { countryExist, stateExist, citiExist, municipioJson } = await this.normalizeMunicipio(municipio as any);
        userWithoutPassword.people.municipio = {
          country: countryExist, state: stateExist, city: citiExist
        }
      }

      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  async updateProfilePhoto(userId:number, file:Express.Multer.File):Promise<any>{
    try {
      if(!userId || !file){
        throw new BadRequestException('El id del usuario y el archivo son obligatorios');
      }
      const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
      const folderPhoto = this.configService.get<string>(CLOUDINARY_PROFILE_FOLDER);
      if(!folderBase || !folderPhoto){
        throw new BadRequestException('La configuración de Cloudinary es incorrecta');
      }
      const folder=`${folderBase}/${folderPhoto}`;
      const user = await this.findById(userId);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      if (user.profilePhoto) {
        const prifilePhotoLink = user.profilePhoto;
        const publicId = prifilePhotoLink.split('/').pop()?.split('.').shift() ?? null;
        if (!publicId) {
          throw new BadRequestException('No se pudo obtener el identificador público de la foto de perfil');
        }
        await this.cloudinaryService.deleteFile(folder, publicId);
      }
      console.log('Subiendo nueva foto de perfil...');
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
        relations: {
          people: {
            typeDni: true
          },
          rol: true
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

  async countUsersAdmins(): Promise<number> {
    try {
      const count = await this.userRepository.count({
        where: { rol: { rol: 'admin' } }
      });
      return count;
    } catch (error) {
      throw error;
    }
  }

  async changeRole(userId: number, rolId: number): Promise<UserEntity> {
    try {
      if (!userId) {
        throw new BadRequestException('El id del usuario es obligatorio');
      }
      if (!rolId) {
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
      if (user.rol.rol == 'admin' && rol.rol != 'admin') {
        const adminCount = await this.countUsersAdmins();
        if (adminCount <= 1) {
          throw new BadRequestException('No se puede cambiar el rol. Debe haber al menos un usuario con rol de admin');
        }
      }
      user.rol = rol;
      return await this.userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  async changeBlockStatus(userId: number, blockStatus: boolean): Promise<UserEntity> {
    try {
      if (!userId) {
        throw new BadRequestException('El id del usuario es obligatorio');
      }
      if (blockStatus === undefined || blockStatus === null) {
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
