import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create.user.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify.email.dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('auth')
export class AuthController {
   constructor(
      private readonly authService: AuthService,
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
   async verifyEmailCode(@Body() dto:VerifyEmailDto): Promise<{ message: string }> {
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

}