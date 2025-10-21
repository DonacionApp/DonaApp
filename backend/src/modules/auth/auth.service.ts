import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { CreateUserDto } from "../user/dto/create.user.dto";
import * as bcrypt from 'bcryptjs';
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../user/entity/user.entity";
import { Repository } from "typeorm";
import { AUTH_LOCK_MINUTES, AUTH_MAX_LOGIN_ATTEMPTS } from "src/config/constants";

@Injectable()
export class AuthService {
   constructor(
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
      private readonly userService: UserService,
      private readonly jwtService: JwtService,
   ) { }

   async generateToken(user: any): Promise<{ access_token: string }> {
      user = user.user ? user.user : user;

      const payload = {
         userId: user.id,
         userName: user.username,
         email: user.email,
         role: user.rol.rol
      };
      const token = {
         access_token: this.jwtService.sign(payload)
      };
      return token;
   }

   private async updateLastLogin(userId: number): Promise<void> {
      await this.userRepository.update(userId, {
         lastLogin: new Date(),
      });
   }

   private isLocked(user: UserEntity): boolean {
      return !!user.lockUntil && user.lockUntil.getTime() > Date.now();
   }

   private lockUntilDate(): Date {
      const d = new Date();
      d.setMinutes(d.getMinutes() + AUTH_LOCK_MINUTES);
      return d;
   }

   private async registerFailedAttempt(user: UserEntity): Promise<void> {
      const next = (user.loginAttempts ?? 0) + 1;
      if (next >= AUTH_MAX_LOGIN_ATTEMPTS) {
         await this.userRepository.update(user.id, {
            loginAttempts: 0,
            lockUntil: this.lockUntilDate(),
         });
      } else {
         await this.userRepository.update(user.id, { loginAttempts: next });
      }
   }

   private async resetLoginAttempts(userId: number): Promise<void> {
      await this.userRepository.update(userId, { loginAttempts: 0, lockUntil: null });
   }

   async registerUser(dto: CreateUserDto): Promise<{ message: string }> {
      try {
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(dto.password, salt);
         dto.password = hashedPassword;
         await this.userService.create(dto);
         return {
            message: 'Usuario registrado exitosamente.',
         };
      } catch (error) {
         throw error;
      }
   }

   async login(dto: LoginDto): Promise<any> {
      try {
         const { email, password } = dto;
         const user = await this.userRepository.findOne({
            where: { email },
            relations: ['rol'],
         });

         if (!user) throw new UnauthorizedException('Credenciales inválidas.');

         if (!user.emailVerified) throw new UnauthorizedException('Correo electrónico no verificado.');

         if(user.block) throw new UnauthorizedException('Cuenta de usuario bloqueada.');

         if (this.isLocked(user)) {
            const minutes = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
            throw new UnauthorizedException(`Cuenta bloqueada temporalmente. Intenta en ${minutes} min.`);
         }
         
         const isPasswordMatching = await bcrypt.compare(password, user.password);

         if (!isPasswordMatching) {
            await this.registerFailedAttempt(user);
            throw new UnauthorizedException('Credenciales inválidas.');
         }

         const userRole = user.rol;
         if (!userRole) throw new UnauthorizedException('El usuario no tiene rol asignado.');

         await this.resetLoginAttempts(user.id);
         await this.updateLastLogin(user.id);
         
         const token = await this.generateToken(user);

         return {
            message: 'Inicio de sesión exitoso.',
            access_token: token.access_token,
         };
      } catch (error) {
         throw error;
      }
   }
}