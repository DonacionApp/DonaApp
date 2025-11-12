import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserEntity } from "../user/entity/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { jwtStrategy,  } from "./strategies/jwt.strategy";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../user/user.module";
import { MailModule } from "src/core/mail/mail.module";
import { RefreshTokenMiddleware } from "src/shared/middleware/refresh-token.middleware";
import { UsersystemModule } from "../usersystem/usersystem.module";
import { SystemModule } from "../system/system.module";

@Module({
   imports: [
      ConfigModule.forRoot(),
      PassportModule,
      JwtModule.registerAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET'),
            signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
         })
      }),
      TypeOrmModule.forFeature([UserEntity]),
      UserModule,
      MailModule,
   forwardRef(() => UsersystemModule),
      
   ],
   providers: [
      AuthService,
      jwtStrategy,
      RefreshTokenMiddleware
   ],
   controllers: [AuthController],
   exports: [AuthService, RefreshTokenMiddleware],
})

export class AuthModule {}