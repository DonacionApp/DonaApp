import { forwardRef, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { CreateUserDto } from "../user/dto/create.user.dto";
import * as bcrypt from 'bcryptjs';
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../user/entity/user.entity";
import { Repository } from "typeorm";
import { AUTH_LOCK_MINUTES, AUTH_MAX_LOGIN_ATTEMPTS, EXPIRES_VERIFICATION, TypeSendEmail, URL_FRONTEND,  URL_FRONTEND_RESET_PASS_TOKEN, URL_FRONTEND_VERIFY, URL_FRONTEND_VERIFY_TOKEN, } from "src/config/constants";
import { MailService } from "src/core/mail/mail.service";
import { MailDto } from "src/core/mail/dto/mail.dto";
import { domainToASCII } from "url";
import { ConfigService } from "@nestjs/config";
import * as optpGenerator from 'otp-generator';
import { UpdateUserDto } from "../user/dto/update.user.dto";
import { UsersystemService } from "../usersystem/usersystem.service";

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
   constructor(
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
      private readonly userService: UserService,
      private readonly jwtService: JwtService,
      private readonly mailService: MailService,
      private readonly configService: ConfigService,
   @Inject(forwardRef(() => UsersystemService))
   private readonly userSystemService: UsersystemService,
   private readonly auditService: AuditService,
   ) { }

   async generateToken(user: any): Promise<{ access_token: string }> {
      user = user.user ? user.user : user;

      const payload = {
         sub: user.id,
         userName: user.username,
         email: user.email,
         rol: user.rol.rol,
         verified:user.verified
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

   async registerUser(dto: CreateUserDto): Promise<{ message: string, statussCode: number }> {
      let user: UserEntity | null = null;
      try {
         if(!dto.password) {
            await this.auditService.createLog(
               0,
               'registerUser',
               'Intento de registro fallido: contraseña no proporcionada',
               500,
               { email: dto.email }
            );
            throw new InternalServerErrorException('La contraseña es obligatoria para el registro.');
         }
         if((dto.password).length < 8) {
            await this.auditService.createLog(
               0,
               'registerUser',
               'Intento de registro fallido: contraseña muy corta',
               500,
               { email: dto.email }
            );
            throw new InternalServerErrorException('La contraseña debe tener al menos 8 caracteres.');
         }
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(dto.password, salt);
         dto.password = hashedPassword;
         user = await this.userService.create(dto);
         await this.sendEmailVerification(user.email, user.username, user.id);
         await this.userSystemService.addUserToSystem(user.id);
         await this.auditService.createLog(
            user.id,
            'registerUser',
            JSON.stringify({
               message: 'Usuario registrado exitosamente',
               payload: { email: user.email },
               response: { message: 'Usuario registrado exitosamente.', statussCode: 200 }
            }),
            200,
            { email: user.email }
         );
         return {
            message: 'Usuario registrado exitosamente.',
            statussCode: 200
         };
      } catch (error) {
            await this.auditService.createLog(
               Number(user?.id) || 0,
               'registerUser',
               JSON.stringify({
                  message: `Error en registro: ${error.message}`,
                  payload: { email: dto.email },
                  response: null
               }),
               error.status || 500,
               { email: dto.email }
            );
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
      let user: UserEntity | null | undefined;
      try {
         const info = new MailDto();
         user = await this.userService.findById(userId);
         if(!user) {
            await this.auditService.createLog(
               0,
               'sendEmailVerification',
               'Usuario no encontrado para enviar la verificación.',
               500,
               { email, userName, userId }
            );
            throw new InternalServerErrorException('Usuario no encontrado para enviar la verificación.');
         }
         if (!email) {
            await this.auditService.createLog(
               user.id,
               'sendEmailVerification',
               'El correo electrónico es obligatorio para enviar la verificación.',
               500,
               { email, userName, userId }
            );
            throw new InternalServerErrorException('El correo electrónico es obligatorio para enviar la verificación.');
         }
         if (!userName) {
            await this.auditService.createLog(
               user.id,
               'sendEmailVerification',
               'El nombre de usuario es obligatorio para enviar la verificación.',
               500,
               { email, userName, userId }
            );
            throw new InternalServerErrorException('El nombre de usuario es obligatorio para enviar la verificación.');
         }
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
         if(!code) {
            await this.auditService.createLog(
               user.id,
               'sendEmailVerification',
               'Error al generar el código de verificación.',
               500,
               { email, userName, userId }
            );
            throw new InternalServerErrorException('Error al generar el código de verificación.');
         }
         info.to = email;
         info.subject = 'verificacion de correo electronico';
         info.type = TypeSendEmail.verifyAccount;
         info.context = {
            user: userName,
            message: 'por favor verifica tu correo electronico para completar el registro',
            title: '!Verifica tu correo electrónico!',
            code: code,
            url: urlToken + `?token=${token.access_token}`,
            secondaryUrl: `${urlVerify}?email=${user.email}`,
         }
         await this.mailService.sendMail(info);
         await this.auditService.createLog(
            user.id,
            'sendEmailVerification',
            'Email de verificación enviado.',
            200,
            { email, userName, userId }
         );
         return { message: 'Email de verificación enviado.' };
      } catch (error) {
         const userIdLog = typeof user === 'object' && user !== null && 'id' in user && user.id ? user.id : 0;
         await this.auditService.createLog(
            userIdLog,
            'sendEmailVerification',
            `Error en sendEmailVerification: ${error.message}`,
            error.status || 500,
            { email, userName, userId }
         );
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

   async sendEmailEmailConfirmation(user:UserEntity):Promise<any>{
      try {
         if(!user) throw new InternalServerErrorException('Usuario no encontrado para enviar la confirmación.');
         if(!user.email) throw new InternalServerErrorException('El correo electrónico es obligatorio para enviar la confirmación.');
         if(!user.username) throw new InternalServerErrorException('El nombre de usuario es obligatorio para enviar la confirmación.');
         const info = new MailDto();
         info.to= user.email;
         info.subject= 'Confirmación de correo';
         info.type= TypeSendEmail.confirmAccount;
         const urlFrontend = this.configService.get<string>(URL_FRONTEND);
         info.context={
            user: user.username,
            message: 'Tu correo ha sido verificado exitosamente.',
            title: '¡corrreo verificado!',
            url: urlFrontend,
         }
         await this.mailService.sendMail(info);
         return {message:'Email de confirmación enviado.'};
      } catch (error) {
         throw error;
      }
   }

   async verifyEmailToken(token:string):Promise<{message:string}>{
      let user: UserEntity | null | undefined;
      try {
         if(!token) {
            await this.auditService.createLog(
               0,
               'verifyEmailToken',
               'Token de verificación no proporcionado',
               401,
               { token }
            );
            throw new UnauthorizedException('Token de verificación no proporcionado.');
         }
         const decoded = this.jwtService.decode(token);
         user = await this.userService.findById(decoded.sub);
         if(!user) {
            await this.auditService.createLog(
               0,
               'verifyEmailToken',
               'Usuario no encontrado para el token proporcionado',
               401,
               { token }
            );
            throw new UnauthorizedException('Usuario no encontrado para el token proporcionado.');
         }
         if(user.emailVerified) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailToken',
               'Correo electrónico ya verificado',
               200,
               { token }
            );
            return {message:'El correo electrónico ya ha sido verificado.'};
         }
         if(user.token!==token) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailToken',
               'Token de verificación inválido',
               401,
               { token }
            );
            throw new UnauthorizedException('Token de verificación inválido.');
         }
         const dateSendCode=user.dateSendCodigo;
         if(!dateSendCode) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailToken',
               'No se encontró la fecha de envío del código de verificación.',
               401,
               { token }
            );
            throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         }
         const isExpired=await this.expire(EXPIRES_VERIFICATION, dateSendCode);
         if(isExpired) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailToken',
               'El token de verificación ha expirado',
               401,
               { token }
            );
            throw new UnauthorizedException('El token de verificación ha expirado. Por favor, solicita uno nuevo.');
         }
         const updateUser=new UpdateUserDto();
         updateUser.isVerifiedEmail=true;
         await this.userService.update(user.id, updateUser);
         await this.sendEmailEmailConfirmation(user);
         await this.auditService.createLog(
            user.id,
            'verifyEmailToken',
            'Correo electrónico verificado exitosamente',
            200,
            { token }
         );
         return {message:'Correo electrónico verificado exitosamente.'};
      } catch (error) {
         const userIdLog = typeof user === 'object' && user !== null && 'id' in user && user.id ? user.id : 0;
         await this.auditService.createLog(
            userIdLog,
            'verifyEmailToken',
            `Error en verifyEmailToken: ${error.message}`,
            error.status || 500,
            { token }
         );
         throw error;
      }
   }

   async verifyEmailCode(email:string, code:string):Promise<{message:string}>{
      let user: UserEntity | null | undefined;
      try {
         if(!email) {
            await this.auditService.createLog(
               0,
               'verifyEmailCode',
               'Correo electrónico no proporcionado',
               401,
               { email, code }
            );
            throw new UnauthorizedException('Correo electrónico no proporcionado.');
         }
         if(!code) {
            await this.auditService.createLog(
               0,
               'verifyEmailCode',
               'Código de verificación no proporcionado',
               401,
               { email, code }
            );
            throw new UnauthorizedException('Código de verificación no proporcionado.');
         }
         user = await this.userService.fyndByEmail(email);
         if(!user) {
            await this.auditService.createLog(
               0,
               'verifyEmailCode',
               'Usuario no encontrado para el correo electrónico proporcionado',
               401,
               { email, code }
            );
            throw new UnauthorizedException('Usuario no encontrado para el correo electrónico proporcionado.');
         }
         if(user.emailVerified) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailCode',
               'Correo electrónico ya verificado',
               200,
               { email, code }
            );
            return {message:'El correo electrónico ya ha sido verificado.'};
         }
         if(user.code!==code) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailCode',
               'Código de verificación inválido',
               401,
               { email, code }
            );
            throw new UnauthorizedException('Código de verificación inválido.');
         }
         const dateSendCode= user.dateSendCodigo;
         if(!dateSendCode) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailCode',
               'No se encontró la fecha de envío del código de verificación.',
               401,
               { email, code }
            );
            throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         }
         const isExpired= await this.expire(EXPIRES_VERIFICATION, dateSendCode);
         if(isExpired) {
            await this.auditService.createLog(
               user.id,
               'verifyEmailCode',
               'El código de verificación ha expirado',
               401,
               { email, code }
            );
            throw new UnauthorizedException('El código de verificación ha expirado. Por favor, solicita uno nuevo.');
         }
         const updateUser=new UpdateUserDto();
         updateUser.isVerifiedEmail=true;
         await this.userService.update(user.id, updateUser);
         await this.sendEmailEmailConfirmation(user);
         await this.auditService.createLog(
            user.id,
            'verifyEmailCode',
            'Correo electrónico verificado exitosamente',
            200,
            { email, code }
         );
         return {message:'Correo electrónico verificado exitosamente.'};
      } catch (error) {
         const userIdLog = typeof user === 'object' && user !== null && 'id' in user && user.id ? user.id : 0;
         await this.auditService.createLog(
            userIdLog,
            'verifyEmailCode',
            `Error en verifyEmailCode: ${error.message}`,
            error.status || 500,
            { email, code }
         );
         throw error;
      }
   }

   async resendEmailVerification(email:string):Promise<{message:string}>{
      let user: UserEntity | null | undefined;
      try {
         user = await this.userService.fyndByEmail(email);
         if(!user) {
            await this.auditService.createLog(
               0,
               'resendEmailVerification',
               'Usuario no encontrado para el correo electrónico proporcionado.',
               401,
               { email }
            );
            throw new UnauthorizedException('Usuario no encontrado para el correo electrónico proporcionado.');
         }
         if(user.emailVerified) {
            await this.auditService.createLog(
               user.id,
               'resendEmailVerification',
               'El correo electrónico ya ha sido verificado.',
               200,
               { email }
            );
            return {message:'El correo electrónico ya ha sido verificado.'};
         }
         const dateSendCode= user.dateSendCodigo;
         if(!dateSendCode) {
            await this.auditService.createLog(
               user.id,
               'resendEmailVerification',
               'No se encontró la fecha de envío del código de verificación.',
               401,
               { email }
            );
            throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         }
         const isExpired= await this.expire(EXPIRES_VERIFICATION,dateSendCode);
         if(!isExpired) {
            await this.auditService.createLog(
               user.id,
               'resendEmailVerification',
               'El código de verificación aún es válido.',
               401,
               { email }
            );
            throw new UnauthorizedException(`El código de verificación aún es válido. Por favor, espera ${EXPIRES_VERIFICATION} minutos antes de solicitar uno nuevo.`);
         }
         await this.sendEmailVerification(user.email, user.username, user.id);
         await this.auditService.createLog(
            user.id,
            'resendEmailVerification',
            'Email de verificación reenviado exitosamente.',
            200,
            { email }
         );
         return {message:'Email de verificación reenviado exitosamente.'};
      } catch (error) {
         const userIdLog = typeof user === 'object' && user !== null && 'id' in user && user.id ? user.id : 0;
         await this.auditService.createLog(
            userIdLog,
            'resendEmailVerification',
            `Error en resendEmailVerification: ${error.message}`,
            error.status || 500,
            { email }
         );
         throw error;
      }
   }

   async login(dto: LoginDto): Promise<any> {
      let user: UserEntity | null = null;
      try {
         const { email, password } = dto;
         user = await this.userRepository.findOne({
            where: { email },
            relations: ['rol'],
         });

         if (!user) {
            await this.auditService.createLog(
               0,
               'login',
               'Intento de login fallido: usuario no encontrado',
               401,
               { email }
            );
            throw new UnauthorizedException('Credenciales inválidas.');
         }

         if (!user.emailVerified) {
            await this.auditService.createLog(
               user.id,
               'login',
               'Intento de login fallido: correo no verificado',
               401,
               { email }
            );
            throw new UnauthorizedException('Correo electrónico no verificado.');
         }

         if (user.block) {
            await this.auditService.createLog(
               user.id,
               'login',
               'Intento de login fallido: cuenta bloqueada',
               401,
               { email }
            );
            throw new UnauthorizedException('Cuenta de usuario bloqueada.');
         }

         if (this.isLocked(user)) {
            const minutes = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
            await this.auditService.createLog(
               user.id,
               'login',
               `Intento de login fallido: cuenta bloqueada temporalmente (${minutes} min)`,
               401,
               { email }
            );
            throw new UnauthorizedException(`Cuenta bloqueada temporalmente. Intenta en ${minutes} min.`);
         }

         const isPasswordMatching = await bcrypt.compare(password, user.password);

         if (!isPasswordMatching) {
            await this.registerFailedAttempt(user);
            await this.auditService.createLog(
               user.id,
               'login',
               'Intento de login fallido: contraseña incorrecta',
               401,
               { email }
            );
            throw new UnauthorizedException('Credenciales inválidas.');
         }

         const userRole = user.rol;
         if (!userRole) {
            await this.auditService.createLog(
               user.id,
               'login',
               'Intento de login fallido: usuario sin rol',
               401,
               { email }
            );
            throw new UnauthorizedException('El usuario no tiene rol asignado.');
         }

         await this.resetLoginAttempts(user.id);
         await this.updateLastLogin(user.id);

         const token = await this.generateToken(user);
         const response={
            message: 'Inicio de sesión exitoso.',
            access_token: token.access_token,
         }
         if (!user.lastLogin) response['firstLogin']=true;

         await this.auditService.createLog(
            user.id,
            'login',
            JSON.stringify({
               message: 'Inicio de sesión exitoso',
               payload: { email },
               response
            }),
            200,
            { email }
         );

         return response;
      } catch (error) {
            await this.auditService.createLog(
               Number(user?.id) || null,
               'login',
               JSON.stringify({
                  message: `Error en login: ${error.message}`,
                  payload: { email: dto.email },
                  response: null
               }),
               error.status || 500,
               { email: dto.email }
            );
         throw error;
      }
   }

    //revisar si el codigo se lo usará mas adelante o no
   async forgotPassword(email:string):Promise<{message:string, statussCode:number}>{
      let user: UserEntity | null = null;
      try {
         user = await this.userService.fyndByEmail(email);
         if(!user) {
            await this.auditService.createLog(
               0,
               'forgotPassword',
               'Recuperación fallida: usuario no encontrado',
               401,
               { email }
            );
            throw new UnauthorizedException('Usuario no encontrado para el correo electrónico proporcionado.');
         }
         if(user.block) {
            await this.auditService.createLog(
               user.id,
               'forgotPassword',
               'Recuperación fallida: cuenta bloqueada',
               401,
               { email }
            );
            throw new UnauthorizedException('La cuenta de usuario está bloqueada.');
         }
         if(!user.emailVerified) {
            await this.auditService.createLog(
               user.id,
               'forgotPassword',
               'Recuperación fallida: correo no verificado',
               401,
               { email }
            );
            throw new UnauthorizedException('El correo electrónico aun no está verificado.');
         }
         if(user.code && user.dateSendCodigo && user.token){
            const isExpired= await this.expire(EXPIRES_VERIFICATION, user.dateSendCodigo);
            if(!isExpired) {
               await this.auditService.createLog(
                  user.id,
                  'forgotPassword',
                  'Recuperación fallida: código ya enviado y no expirado',
                  401,
                  { email }
               );
               throw new UnauthorizedException(`Ya se ha enviado un código para restaurar la contraseña. Por favor, espera ${EXPIRES_VERIFICATION} minutos antes de solicitar uno nuevo.`);
            }
         }
         const token = await this.generateToken(user);
         const code= await this.generateCode(6);
         const updateUser= new UpdateUserDto();
         updateUser.code=code;
         updateUser.token=token.access_token;
         updateUser.dateSendCodigo= new Date();
         const urlFrontend = this.configService.get<string>(URL_FRONTEND);
         const urlFrontendResetPassToken = this.configService.get<string>(URL_FRONTEND_RESET_PASS_TOKEN);
         const info= new MailDto();
         info.to=user.email;
         info.subject='Restablecimiento de contraseña';
         info.type= TypeSendEmail.resetPassword;
         info.context={
            user:user.username,
            url:`${urlFrontend}${urlFrontendResetPassToken}?token=${token.access_token}`,
            code:code,
            message: `Recibimos una solicitud para restablecer tu contraseña, la cuenta entrara en un estado de bloqueo, mientras se completa el 
                    proceso, si no fuiste tu ponte en contacto con soporte o solicita tu mismo un cambio de contraseña en ${EXPIRES_VERIFICATION} minutos, `
         }
         await this.userService.update(user.id, updateUser);
         await this.mailService.sendMail(info);
         await this.auditService.createLog(
            user.id,
            'forgotPassword',
            JSON.stringify({
               message: 'Instrucciones de recuperación enviadas',
               payload: { email },
               response: { message: 'Instrucciones para restablecer la contraseña enviadas al correo electrónico.', statussCode: 200 }
            }),
            200,
            { email }
         );
         return {message:'Instrucciones para restablecer la contraseña enviadas al correo electrónico.', statussCode:200};

      } catch (error) {
            await this.auditService.createLog(
               Number(user?.id) || 0,
               'forgotPassword',
               JSON.stringify({
                  message: `Error en recuperación: ${error.message}`,
                  payload: { email },
                  response: null
               }),
               error.status || 500,
               { email }
            );
         throw error;
      }
   }

   async resetPassword(token:string, newPassword:string):Promise<{message:string, statussCode:number}>{
      let user: UserEntity | null = null;
      try {
         if(!token || !newPassword) {
            await this.auditService.createLog(
               0,
               'resetPassword',
               'Token o nueva contraseña no proporcionados',
               401,
               { token: !!token, newPassword: !!newPassword }
            );
            throw new UnauthorizedException('Token o nueva contraseña no proporcionados.');
         }
         const decoded = this.jwtService.decode(token);
         user = await this.userService.findById(decoded.sub);
         if(!user) {
            await this.auditService.createLog(
               0,
               'resetPassword',
               'Usuario no encontrado para el token proporcionado',
               401,
               { token }
            );
            throw new UnauthorizedException('usuario no encontrado para el token proporcionado');
         }
         if(!user.token || !user.code || !user.dateSendCodigo) {
            await this.auditService.createLog(
               user.id,
               'resetPassword',
               'No hay una solicitud de restablecimiento de contraseña para este usuario.',
               401,
               { token }
            );
            throw new UnauthorizedException('No hay una solicitud de restablecimiento de contraseña para este usuario.');
         }
         const dateSendCode=user.dateSendCodigo;
         if(!dateSendCode) {
            await this.auditService.createLog(
               user.id,
               'resetPassword',
               'No se encontró la fecha de envío del código de verificación.',
               401,
               { token }
            );
            throw new UnauthorizedException('No se encontró la fecha de envío del código de verificación.');
         }
         const isExpired= await this.expire(EXPIRES_VERIFICATION, dateSendCode);
         if(isExpired) {
            await this.auditService.createLog(
               user.id,
               'resetPassword',
               'El token para restablecer la contraseña ha expirado',
               401,
               { token }
            );
            throw new UnauthorizedException('el token para restablece la contraseña ha expirado, por favor solicita uno nuevo')
         }
         if(user.token!==token) {
            await this.auditService.createLog(
               user.id,
               'resetPassword',
               'Token invalido para restablecer la contraseña',
               401,
               { token }
            );
            throw new UnauthorizedException('Token invalido para restablecer la contraseña');
         }
         const salt = await bcrypt.genSalt(10);
         const hashedPassword= await bcrypt.hash(newPassword,salt);
         const updateUser= new UpdateUserDto();
         updateUser.password=hashedPassword;
         updateUser.code='';
         updateUser.token='';
         updateUser.dateSendCodigo=null;
         await this.userService.update(user.id, updateUser,true);
         await this.auditService.createLog(
            user.id,
            'resetPassword',
            JSON.stringify({
               message: 'Contraseña restablecida exitosamente',
               payload: { token },
               response: { message: 'Contraseña restablecida exitosamente.', statussCode: 200 }
            }),
            200,
            { token }
         );
         return {message:'Contraseña restablecida exitosamente.', statussCode:200};
      } catch (error) {
            await this.auditService.createLog(
               Number(user?.id) || 0,
               'resetPassword',
               JSON.stringify({
                  message: `Error en resetPassword: ${error.message}`,
                  payload: { token },
                  response: null
               }),
               error.status || 500,
               { token }
            );
         throw error;
      }
   }

   async updateMe(dto: UpdateUserDto, userId:number,):Promise<any>{
      try {
         return await this.userService.update(userId, dto,false);
      } catch (error) {
         throw error;
      }
   }

   async updateProfilePhoto(userId:number, file:Express.Multer.File):Promise<any>{
      try {
         return await this.userService.updateProfilePhoto(userId, file);
      } catch (error) {
         throw error;
      }
   }

   async updateSupportId(userId:number, file:Express.Multer.File):Promise<any>{
      try {
         return await this.userService.updateSupportId(userId, file);
      } catch (error) {
         throw error;
      }
   }

   async getProfile(userId:number):Promise<any>{
      try {
         return await this.userService.findById(userId);
      } catch (error) {
         throw error;
      }
   }
}