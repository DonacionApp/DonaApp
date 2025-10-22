import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { CreateUserDto } from "../user/dto/create.user.dto";
import * as bcrypt from 'bcryptjs';
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../user/entity/user.entity";
import { Repository } from "typeorm";
import { AUTH_LOCK_MINUTES, AUTH_MAX_LOGIN_ATTEMPTS, EXPIRES_VERIFICATION, TypeSendEmail, URL_FRONTEND, URL_FRONTEND_VERIFY, URL_FRONTEND_VERIFY_TOKEN, } from "src/config/constants";
import { MailService } from "src/core/mail/mail.service";
import { MailDto } from "src/core/mail/dto/mail.dto";
import { domainToASCII } from "url";
import { ConfigService } from "@nestjs/config";
import * as optpGenerator from 'otp-generator';
import { UpdateUserDto } from "../user/dto/update.user.dto";

@Injectable()
export class AuthService {
   constructor(
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
      private readonly userService: UserService,
      private readonly jwtService: JwtService,
      private readonly mailService: MailService,
      private readonly configService: ConfigService,
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
         const user=await this.userService.create(dto);
         await this.sendEmailVerification(user.email, user.username, user.id)
         return {
            message: 'Usuario registrado exitosamente.',
         };
      } catch (error) {
         throw error;
      }
   }

   async generateCode(length: number): Promise<string> {
      try {
         const otp_code_veirfy = optpGenerator.generate(length, {
            upperCaseAlphabets: false,
            specialChars: false,
            alphabets: false,
         });
         if (!otp_code_veirfy) throw new InternalServerErrorException('Error al generar el código de verificación.');
         return otp_code_veirfy;

      } catch (error) {
         throw error;
      }
   }

   async sendEmailVerification(email: string, userName: string, userId: number): Promise<{ message: string | any }> {
      try {
         const info = new MailDto();
         const user=await this.userService.findById(userId);
         if(!user) throw new InternalServerErrorException('Usuario no encontrado para enviar la verificación.');
         if (!email) throw new InternalServerErrorException('El correo electrónico es obligatorio para enviar la verificación.');
         if (!userName) throw new InternalServerErrorException('El nombre de usuario es obligatorio para enviar la verificación.');
         const urlFrontend = this.configService.get<string>(URL_FRONTEND);
         const urlFrontendVerifyToken = this.configService.get<string>(URL_FRONTEND_VERIFY_TOKEN);
         const urlFrontendVerify = this.configService.get<string>(URL_FRONTEND_VERIFY);
         const urlToken = `${urlFrontend}${urlFrontendVerifyToken}`;
         const urlVerify = `${urlFrontend}${urlFrontendVerify}`;
         const token = await this.generateToken(user);
         const code = await this.generateCode(6);
         const updateUser=new UpdateUserDto();
         updateUser.code=code;
         updateUser.token=token.access_token;
         updateUser.dateSendCodigo=new Date();
         if(user.block)updateUser.block=false;
         await this.userService.update(userId, updateUser);
         if(!code) throw new InternalServerErrorException('Error al generar el código de verificación.');
         info.to = email;
         info.subject = 'verificacion de correo electronico';
         info.type = TypeSendEmail.verifyAccount;
         info.context = {
            user: userName,
            message: 'por favor verifica tu correo electronico para completar el registro',
            title: '!Verifica tu correo electrónico!',
            code: code,
            url: urlToken + `?token=${token.access_token}`,
            secondaryUrl: urlVerify,
         }
         await this.mailService.sendMail(info);
         return { message: 'Email de verificación enviado.' };
      } catch (error) {
         throw error;
      }
   }

   async expire(time:number, dateSendCode:Date):Promise<boolean>{
      try {
         const now = new Date();
         const diffMs=now.getTime()-dateSendCode.getTime();
         const diffMins=Math.floor(diffMs/(1000*60));
         if(diffMins>time) return true;
         return false;
      } catch (error) {
         throw error;
      }
   }

   async verifyEmailToken(token:string):Promise<{message:string}>{
      try {
         if(!token) throw new UnauthorizedException('Token de verificación no proporcionado.');
         const decoded = this.jwtService.decode(token);
         console.log(decoded);
         console.log(decoded.userId)
         const user= await this.userService.findById(decoded.userId);
         if(!user) throw new UnauthorizedException('Usuario no encontrado para el token proporcionado.');
         if(user.emailVerified) return {message:'El correo electrónico ya ha sido verificado.'};
         if(user.token!==token) throw new UnauthorizedException('Token de verificación inválido.');
         const dateSendCode=user.dateSendCodigo;
         if(!dateSendCode) throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         const isExpired=await this.expire(EXPIRES_VERIFICATION, dateSendCode);
         if(isExpired) throw new UnauthorizedException('El token de verificación ha expirado. Por favor, solicita uno nuevo.');
         
         const updateUser=new UpdateUserDto();
         updateUser.isVerifiedEmail=true;
         await this.userService.update(user.id, updateUser);
         return {message:'Correo electrónico verificado exitosamente.'};
      } catch (error) {
         throw error;
      }
   }

   async verifyEmailCode(email:string, code:string):Promise<{message:string}>{
      try {
         if(!email) throw new UnauthorizedException('Correo electrónico no proporcionado.');
         if(!code) throw new UnauthorizedException('Código de verificación no proporcionado.');
         const user= await this.userService.fyndByEmail(email);
         if(!user) throw new UnauthorizedException('Usuario no encontrado para el correo electrónico proporcionado.');
         if(user.emailVerified) return {message:'El correo electrónico ya ha sido verificado.'};
         if(user.code!==code) throw new UnauthorizedException('Código de verificación inválido.');
         const dateSendCode= user.dateSendCodigo;
         if(!dateSendCode) throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         const isExpired= await this.expire(EXPIRES_VERIFICATION, dateSendCode);
         if(isExpired) throw new UnauthorizedException('El código de verificación ha expirado. Por favor, solicita uno nuevo.');
         const updateUser=new UpdateUserDto();
         updateUser.isVerifiedEmail=true;
         await this.userService.update(user.id, updateUser);
         return {message:'Correo electrónico verificado exitosamente.'};
      } catch (error) {
         throw error;
      }
   }

   async resendEmailVerification(email:string):Promise<{message:string}>{
      try {
         const user= await this.userService.fyndByEmail(email);
         if(!user) throw new UnauthorizedException('Usuario no encontrado para el correo electrónico proporcionado.');
         if(user.emailVerified) return {message:'El correo electrónico ya ha sido verificado.'};
         const dateSendCode= user.dateSendCodigo;
         if(!dateSendCode) throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         const isExpired= await this.expire(EXPIRES_VERIFICATION,dateSendCode);
         if(!isExpired) throw new UnauthorizedException(`El código de verificación aún es válido. Por favor, espera ${EXPIRES_VERIFICATION} minutos antes de solicitar uno nuevo.`);
         await this.sendEmailVerification(user.email, user.username, user.id);
         return {message:'Email de verificación reenviado exitosamente.'};
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

         if (user.block) throw new UnauthorizedException('Cuenta de usuario bloqueada.');

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