import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create.user.dto";
import { LoginDto } from "./dto/login.dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('auth')
export class AuthController {
   constructor (
      private readonly authService: AuthService,
   ) {}

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
}