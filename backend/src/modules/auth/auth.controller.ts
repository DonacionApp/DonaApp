import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Req, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create.user.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify.email.dto";
import { ResetPasswordDto } from "./dto/reset.password.dt";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { UpdateUserDto } from "../user/dto/update.user.dto";
import { JwtService } from "@nestjs/jwt";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('auth')
export class AuthController {
   constructor(
      private readonly authService: AuthService,
      private readonly jwtService: JwtService,
   ) { }

   @Post('register')
   @HttpCode(HttpStatus.CREATED)
   async register(@Body() dto: CreateUserDto): Promise<{ message: string }> {
      return await this.authService.registerUser(dto);
   }

   @Post('login')
   @HttpCode(HttpStatus.OK)
   async login(@Body() dto: LoginDto): Promise<any> {
      return await this.authService.login(dto);
   }

   @Post('verify-email-token')
   async verifyEmailToken(@Body('token') token: string): Promise<{ message: string }> {
      try {
         return await this.authService.verifyEmailToken(token);
      } catch (error) {
         throw error;
      }

   }

   @Post('verify-email-code')
   async verifyEmailCode(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
      try {
         return await this.authService.verifyEmailCode(dto.email, dto.code);
      } catch (error) {
         throw error;
      }
   }

   @Post('resend-verification-email')
   async resendVerificationEmail(@Body('email') email: string): Promise<{ message: string }> {
      try {
         return await this.authService.resendEmailVerification(email);
      } catch (error) {
         throw error;
      }
   }

   @Post('forgot-password')
   async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
      try {
         return await this.authService.forgotPassword(email);
      } catch (error) {
         throw error;
      }
   }

   @Post('verify-reset-passord-token')
   async verrifyResetPasswordToken(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
      try {
         return await this.authService.resetPassword(dto.token, dto.newPassword);
      } catch (error) {
         throw error;
      }
   }

   @UseGuards(JwtAuthGuard)
   @Post('update-me')
   async updateMe(@Body() dto: UpdateUserDto, @Headers('authorization') authHeader: string) {
      try {
         const token = authHeader.replace('Bearer ', '');
         if (!token) throw new UnauthorizedException('Token no proporcionado.');
         const decoded = await this.jwtService.verifyAsync(token);
         const { sub, userName, email, rol } = decoded;
         console.log('Usuario autenticado:', { sub, userName, email, rol });
         return await this.authService.updateMe(dto,sub);
      } catch (error) {
         throw error;
      }


   }

   @UseGuards(JwtAuthGuard)
   @Get('profile')
   async getProfile(@Headers('authorization') authHeader: string): Promise<any> {
      try {
         const token = authHeader.replace('Bearer ', '');
         if (!token) throw new UnauthorizedException('Token no proporcionado.');
         const decoded = await this.jwtService.verifyAsync(token);
         const { sub, userName, email, rol } = decoded;
         return await this.authService.getProfile(sub);
      } catch (error) {
         throw error;
      }
   }

}