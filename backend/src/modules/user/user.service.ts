import { BadRequestException, Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, Brackets } from 'typeorm';
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
import { CLOUDINARY_DOCS_FOLDER, CLOUDINARY_FOLDER_BASE, CLOUDINARY_PROFILE_FOLDER } from 'src/config/constants';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { NotifyService } from '../notify/notify.service';
import { TypeNotifyService } from '../typenotify/typenotify.service';

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
    @Inject(forwardRef(() => NotifyService))
    private readonly notifyService: NotifyService,
    private readonly typeNotifyService: TypeNotifyService,
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
      if(user.location){
        const locationJson= JSON.parse(user.location as any);
        userWithoutPassword.location=locationJson;
      }

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

  async update(id: number, dto: UpdateUserDto, resetPass?: boolean): Promise<UserEntity> {
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

      
      if(dto.location!=undefined && dto.location!==null){
          const locateString=JSON.stringify(dto.location) as any;
          user.location=locateString
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
          user.block = false;

        }
      }
      if (dto.profilePhoto) {
        user.profilePhoto = dto.profilePhoto;
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

      const usuario = await this.userRepository.save(user);

      const { password,loginAttempts,token, lockUntil,dateSendCodigo,code, ...userWithoutPassword } = usuario as any;
      if (usuario.people.municipio) {
        const municipio = usuario.people.municipio;
        const { countryExist, stateExist, citiExist, municipioJson } = await this.normalizeMunicipio(municipio as any);
        userWithoutPassword.people.municipio = {
          country: countryExist, state: stateExist, city: citiExist
        }
      }
      if(userWithoutPassword.location){
        const locationJson= JSON.parse(userWithoutPassword.location as any);
        userWithoutPassword.location=locationJson;
      }

      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  async updateProfilePhoto(userId: number, file: Express.Multer.File): Promise<any> {
    try {
      if (!userId || !file) {
        throw new BadRequestException('El id del usuario y el archivo son obligatorios');
      }
      const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
      const folderPhoto = this.configService.get<string>(CLOUDINARY_PROFILE_FOLDER);
      if (!folderBase || !folderPhoto) {
        throw new BadRequestException('La configuración de Cloudinary es incorrecta');
      }
      const folder = `${folderBase}/${folderPhoto}`;
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
      const newImage = await this.cloudinaryService.uploadImage(folder, file);
      const urlNewImage = (newImage as any).secure_url;
      const userData = new UpdateUserDto();
      userData.profilePhoto = urlNewImage;
      const updatedUser = await this.update(userId, userData);
      return { status: 'success', profilePhoto: urlNewImage, statusCode: 200, message: 'Foto de perfil actualizada correctamente' };
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

  async updateSupportId(userId: number, file: Express.Multer.File): Promise<any> {
    try {
      if (!userId || !file) {
        throw new BadRequestException('El id del usuario y el archivo son obligatorios');
      }
      const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
      const folderDocs = this.configService.get<string>(CLOUDINARY_DOCS_FOLDER);
      if (!folderBase || !folderDocs) {
        throw new BadRequestException('La configuración de Cloudinary es incorrecta');
      }
      const folder = `${folderBase}/${folderDocs}`;
      const user = await this.findById(userId);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      if (!user.verified) {
        if (user.people.supportId) {
          const supporIdLink = user.people.supportId;
          const publicId = supporIdLink.split('/').pop()?.split('.').shift() ?? null;
          if (!publicId) {
            throw new BadRequestException('No se pudo obtener el identificador público del documento de soporte');
          }
          await this.cloudinaryService.deleteFile(folder, publicId);
        }
        const newDocument = await this.cloudinaryService.uploadPDF(folder, file);
        const urlNewDocument = (newDocument as any).secure_url;
        console.log('URL nuevo documento de soporte:', urlNewDocument);
        const userNew = new UpdateUserDto();
        userNew.people = { supportId: urlNewDocument } as any;
        const updatedUser = await this.update(userId, userNew);
        try {
          const typeNotify = await this.typeNotifyService.getByType('informaacion');
          await this.notifyService.createNotifyForAdmins({
            title: 'Nuevo documento de soporte',
            message: `El usuario ${user.username} ha subido un nuevo documento de soporte para verificación.`,
            typeNotifyId: typeNotify.id,
            link: null,
          });
        } catch (err) {
          // no bloquear el flujo si falla la notificación
          console.error('Error enviando notificación a admins:', err);
        }
        return { status: 'success', supportId: urlNewDocument, statusCode: 200, message: 'Documento de soporte actualizado correctamente' };
      }
      return { status: 'info', statusCode: 200, message: 'El usuario ya está verificado, no se puede actualizar el documento de soporte' };

    } catch (error) {
      throw error;
    }
  }

  async getUserInfoMinimal(userId: number): Promise<Partial<UserEntity>> {
    try {
      if (!userId) throw new BadRequestException('El id del usuario es obligatorio');
      
      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .leftJoinAndSelect('user.people', 'people')
        .loadRelationCountAndMap('user.countPosts', 'user.post')
        .loadRelationCountAndMap('user.countDonations', 'user.donation')
        .where('user.id = :userId', { userId })
        .getOne();
      
      if (!user) throw new NotFoundException('Usuario no encontrado');
      
     const { id, username, email, profilePhoto, emailVerified, verified, location, createdAt } = user;
      const roleName = user.rol?.rol ?? null;
      const residencia = user.people?.residencia ?? null;
      const countPosts = (user as any).countPosts ?? 0;
      const countDonations = (user as any).countDonations ?? 0;
      
      let municipio: any = null;
      if(user.location){
        const locationJson=JSON.parse(user.location as any)
        user.location=locationJson
      }
      if (user.people?.municipio) {
        try {
          const { countryExist, stateExist, citiExist } = await this.normalizeMunicipio(user.people.municipio as any);
          municipio = { country: countryExist, state: stateExist, city: citiExist };
        } catch (_) {}
      }
      
      return {
        id,
        username,
        email,
        profilePhoto,
        emailVerified,
        verified,
        location:user.location,
        createdAt,
        rol: roleName,
        residencia,
        municipio,
        countPosts,
        countDonations
      } as any;
    } catch (error) {
      throw error;
    }
  }

  async getOrganzationUsers(options?: any):Promise<any[]>{
    try {
      const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
      let offset = Number(options?.offset) || 0;
      if (options?.page && Number(options.page) > 0) {
        offset = (Number(options.page) - 1) * limit;
      }
      const cursor = options?.cursor ? new Date(String(options.cursor)) : null;
      const searchParam = options?.searchParam ? String(options.searchParam).trim() : null;

      const qb = this.userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .leftJoinAndSelect('user.people', 'people')
        .where('rol.rol = :roleName', { roleName: 'organizacion' });

      if (searchParam) {
        const s = `%${searchParam}%`;
        qb.andWhere('(user.username ILIKE :s OR user.email ILIKE :s OR people.residencia ILIKE :s OR people.name ILIKE :s)', { s });
      }

      if (cursor && !isNaN(cursor.getTime())) {
        qb.andWhere('user.createdAt < :cursor', { cursor: cursor.toISOString() });
      }

      const orderField = options?.orderBy === 'updatedAt' ? 'user.updatedAt' : 'user.createdAt';
      qb.orderBy(orderField, 'DESC')
        .skip(offset)
        .take(limit);

      const result = await qb.getMany();

      if (!result || result.length === 0) return [];

      const usersWithMinimalInfo = result.map(user => {
        const { id, username, email, profilePhoto, emailVerified, verified, createdAt, location, rol } = user as any;
        const residencia = user.people?.residencia ?? null;
        const locationJson = location ? (() => { try { return JSON.parse(location as any); } catch { return null; } })() : null;
        return { id, username, email, profilePhoto, emailVerified, verified, createdAt, residencia, location: locationJson, rol: rol?.rol };
      });

      return usersWithMinimalInfo as any;
    } catch (error) {
      throw error;
    }
  }

  async usersUploadIdSupport(options?: { limit?: number; cursor?: string; search?: string; orderBy?: 'created' | 'updated'; order?: 'ASC' | 'DESC'; hasSupport?: boolean }): Promise<any> {
    try {
      const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
      const take = limit + 1;
      const orderByField = options?.orderBy === 'updated' ? 'user.updatedAt' : 'user.createdAt';
      const orderDirection = options?.order === 'ASC' ? 'ASC' : 'DESC';

      const qb = this.userRepository.createQueryBuilder('user')
        .leftJoin('user.people', 'people')
        .leftJoin('user.rol', 'rol')
        .select([
          'user.id AS user_id',
          'user.username AS user_username',
          'user.email AS user_email',
          'user.profilePhoto AS user_profile_photo',
          'user.createdAt AS user_created_at',
          'user.updatedAt AS user_updated_at',
          'people.id AS people_id',
          'people.name AS people_name',
          'people.lastName AS people_last_name',
          'people.dni AS people_dni',
          'people.supportId AS people_support_id',
          'rol.id AS rol_id',
          'rol.rol AS rol_name',
        ])
        .orderBy(orderByField, orderDirection)
        .addOrderBy('user.id', orderDirection)
        .take(take);

      if (options?.search) {
        const s = `%${String(options.search).trim()}%`;
        const sLower = s.toLowerCase();
        qb.andWhere(new Brackets(q => {
          q.where('user.username ILIKE :s', { s })
            .orWhere('user.email ILIKE :s', { s })
            .orWhere('people.name ILIKE :s', { s })
            .orWhere('people.lastName ILIKE :s', { s })
            .orWhere('people.dni LIKE :s', { s });
        }));
      }

      if (options?.cursor) {
        const parts = String(options.cursor).split('_');
        const cursorDate = new Date(parts[0]);
        const cursorId = parts[1] ? Number(parts[1]) : 0;
        const isAsc = orderDirection === 'ASC';

        if (!isNaN(cursorDate.getTime())) {
          if (isAsc) {
            qb.andWhere(new Brackets(q => {
              q.where(`${orderByField} > :cursorDate`, { cursorDate })
                .orWhere(`${orderByField} = :cursorDate AND user.id > :cursorId`, { cursorDate, cursorId });
            }));
          } else {
            qb.andWhere(new Brackets(q => {
              q.where(`${orderByField} < :cursorDate`, { cursorDate })
                .orWhere(`${orderByField} = :cursorDate AND user.id < :cursorId`, { cursorDate, cursorId });
            }));
          }
        }
      }

      // Filter only users that have uploaded supportId
      if (options?.hasSupport) {
        qb.andWhere('people.supportId IS NOT NULL');
      }

      const raws = await qb.getRawMany();
      let rows = raws;
      let nextCursor: string | undefined;
      if (raws.length > limit) {
        const next = raws[limit];
        const dateKey = options?.orderBy === 'updated' ? 'user_updated_at' : 'user_created_at';
        const nextDate = new Date(next[dateKey]).toISOString();
        const nextId = next['user_id'];
        nextCursor = `${nextDate}_${nextId}`;
        rows = raws.slice(0, limit);
      }

      const items = rows.map(r => ({
        id: r['user_id'],
        username: r['user_username'],
        email: r['user_email'],
        profilePhoto: r['user_profile_photo'],
        createdAt: r['user_created_at'],
        updatedAt: r['user_updated_at'],
        people: r['people_id'] ? {
          id: r['people_id'],
          name: r['people_name'],
          lastName: r['people_last_name'],
          dni: r['people_dni'],
          supportId: r['people_support_id'],
        } : null,
        role: r['rol_id'] ? { id: r['rol_id'], name: r['rol_name'] } : null,
      }));

      return { items, nextCursor } as any;
    } catch (error) {
      throw error;
    }
  }
  
}
