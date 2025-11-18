import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/user/entity/user.entity';

export class WsTokenRefreshHelper {
  private static readonly logger = new Logger('WsTokenRefreshHelper');

  static async validateAndRefreshToken(
    socket: Socket,
    jwtService: JwtService,
    userRepository: Repository<UserEntity>,
  ): Promise<{ 
    valid: boolean; 
    userId?: number; 
    newToken?: string; 
    userName?: string;
    tokenRefreshed?: boolean;
  }> {
    try {
      const token = 
        socket.handshake?.auth?.token || 
        (socket.handshake?.headers?.authorization || '').replace(/^Bearer\s+/i, '') || 
        null;

      if (!token) {
        this.logger.warn(`Socket ${socket.id} sin token`);
        socket.emit('error', { message: 'Token no proporcionado', code: 'NO_TOKEN' });
        return { valid: false };
      }

      let payload: any;
      let tokenExpired = false;

      // Intentar verificar el token
      try {
        payload = await jwtService.verifyAsync(token);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          this.logger.log(`Token expirado detectado en socket ${socket.id} - Intentando refresh...`);
          tokenExpired = true;
          
          // Decodificar el token expirado para obtener el payload
          payload = jwtService.decode(token) as any;
        } else {
          this.logger.warn(`Token inválido en socket ${socket.id}: ${error.message}`);
          socket.emit('error', { message: 'Token inválido', code: 'INVALID_TOKEN' });
          return { valid: false };
        }
      }

      if (!payload || !payload.sub) {
        this.logger.warn(`Socket ${socket.id} token sin userId`);
        socket.emit('error', { message: 'Token sin información de usuario', code: 'INVALID_PAYLOAD' });
        return { valid: false };
      }

      const userId = Number(payload.id ?? payload.sub);

      // Si el token está expirado, generar uno nuevo
      if (tokenExpired) {
        try {
          // Buscar usuario en BD para validar estado actual
          const user = await userRepository.findOne({
            where: { id: userId },
            relations: ['rol'],
          });

          if (!user) {
            this.logger.warn(`Usuario ${userId} no encontrado para refresh`);
            socket.emit('error', { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' });
            socket.disconnect(true);
            return { valid: false };
          }

          // Validar estado del usuario
          if (user.block) {
            this.logger.warn(`Usuario ${userId} bloqueado`);
            socket.emit('error', { message: 'Usuario bloqueado', code: 'USER_BLOCKED' });
            socket.disconnect(true);
            return { valid: false };
          }

          if (!user.emailVerified) {
            this.logger.warn(`Usuario ${userId} sin email verificado`);
            socket.emit('error', { message: 'Email no verificado', code: 'EMAIL_NOT_VERIFIED' });
            socket.disconnect(true);
            return { valid: false };
          }

          // Generar nuevo token
          const newPayload = {
            sub: user.id,
            userName: user.username,
            email: user.email,
            rol: user.rol?.rol || 'user',
            verified: user.verified,
          };

          const newToken = jwtService.sign(newPayload);

          this.logger.log(`✅ Token refrescado para usuario ${user.username} (${userId}) en socket ${socket.id}`);

          // Emitir el nuevo token al cliente
          socket.emit('token-refreshed', { 
            token: newToken,
            message: 'Tu token ha sido refrescado automáticamente',
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          });

          return { 
            valid: true, 
            userId, 
            newToken, 
            userName: user.username,
            tokenRefreshed: true 
          };

        } catch (refreshError) {
          this.logger.error(`Error al refrescar token para socket ${socket.id}:`, refreshError);
          socket.emit('error', { 
            message: 'Error al refrescar token', 
            code: 'REFRESH_ERROR' 
          });
          socket.disconnect(true);
          return { valid: false };
        }
      }

      // Token válido, no expirado
      return { 
        valid: true, 
        userId, 
        userName: payload.userName,
        tokenRefreshed: false 
      };

    } catch (error) {
      this.logger.error(`Error inesperado en validateAndRefreshToken:`, error);
      socket.emit('error', { message: 'Error de autenticación', code: 'AUTH_ERROR' });
      return { valid: false };
    }
  }

  /**
   * Valida si el token está cerca de expirar (útil para refresh preventivo)
   */
  static isTokenNearExpiry(token: string, jwtService: JwtService, minutesBeforeExpiry: number = 5): boolean {
    try {
      const decoded = jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) return false;

      const expiryTime = decoded.exp * 1000; // Convertir a ms
      const timeUntilExpiry = expiryTime - Date.now();
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

      return minutesUntilExpiry <= minutesBeforeExpiry && minutesUntilExpiry > 0;
    } catch {
      return false;
    }
  }
}
