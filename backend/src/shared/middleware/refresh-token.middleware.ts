import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/user/entity/user.entity';

@Injectable()
export class RefreshTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      try {
        this.jwtService.verify(token);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          console.log('Token expirado detectado - Refrescando automáticamente...');

          try {
            const decoded = this.jwtService.decode(token) as any;

            if (!decoded || !decoded.sub) {
              return next();
            }

            const user = await this.userRepository.findOne({
              where: { id: decoded.sub },
              relations: ['rol'],
            });

            if (!user || user.block || !user.emailVerified) {
              return next();
            }

            const payload = {
              sub: user.id,
              userName: user.username,
              email: user.email,
              rol: user.rol.rol,
              verified:user.verified
            };

            const newToken = this.jwtService.sign(payload);

            req.headers['authorization'] = `Bearer ${newToken}`;
            res.setHeader('X-New-Token', newToken);

            console.log('Token refrescado exitosamente para usuario:', user.username);
          } catch (refreshError) {
            console.error(' Error al refrescar token:', refreshError);
          }
        }
      }
    }

    next();
  }
}
