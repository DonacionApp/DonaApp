import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { UserEntity } from 'src/modules/user/entity/user.entity';
import { WsTokenRefreshHelper } from '../helpers/ws-token-refresh.helper';

/**
 * Guard para WebSocket que valida y refresca tokens automáticamente
 * Uso: @UseGuards(WsRefreshGuard) en @SubscribeMessage()
 */
@Injectable()
export class WsRefreshGuard implements CanActivate {
  private readonly logger = new Logger(WsRefreshGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    try {
      const result = await WsTokenRefreshHelper.validateAndRefreshToken(
        client,
        this.jwtService,
        this.userRepository,
      );

      if (!result.valid) {
        return false;
      }

      // Adjuntar userId al socket para uso posterior
      (client as any).userId = result.userId;
      (client as any).userName = result.userName;

      if (result.tokenRefreshed) {
        this.logger.debug(`Token refrescado para usuario ${result.userName} (${result.userId})`);
      }

      return true;
    } catch (error) {
      this.logger.error('Error en WsRefreshGuard:', error);
      client.emit('error', { message: 'Error de autenticación' });
      return false;
    }
  }
}
