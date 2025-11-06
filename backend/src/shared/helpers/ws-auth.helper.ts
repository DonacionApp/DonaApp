import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

export class WsAuthHelper {
  private static readonly logger = new Logger(WsAuthHelper.name);

  static async validateConnection(
    client: Socket,
    jwtService: JwtService,
    configService: ConfigService,
  ): Promise<{ valid: boolean; userId?: number; userName?: string }> {
    try {
      // Obtener token del handshake (puede venir en auth, headers o query)
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(` Connection rejected - No token provided: ${client.id}`);
        client.emit('error', { message: 'Token de autenticación requerido' });
        client.disconnect();
        return { valid: false };
      }

      // Limpiar el token si viene con "Bearer "
      const cleanToken = token.replace('Bearer ', '').trim();

      // Verificar el token JWT
      let payload: any;
      try {
        payload = await jwtService.verifyAsync(cleanToken, {
          secret: configService.get('JWT_SECRET'),
        });
      } catch (error) {
        this.logger.warn(` Connection rejected - Invalid token: ${client.id}`);
        client.emit('error', {
          message:
            error.name === 'TokenExpiredError'
              ? 'Token expirado'
              : 'Token inválido',
        });
        client.disconnect();
        return { valid: false };
      }

      // Extraer userId del payload
      const userId = payload.sub || payload.id;

      if (!userId) {
        this.logger.warn(` Connection rejected - No userId in token: ${client.id}`);
        client.emit('error', { message: 'Token inválido: no contiene userId' });
        client.disconnect();
        return { valid: false };
      }

      const userName = payload.userName || payload.email;
      this.logger.log(`Token validated for user ${userId} (${userName})`);

      return {
        valid: true,
        userId: Number(userId),
        userName,
      };
    } catch (error) {
      this.logger.error(` Error validating connection: ${error.message}`);
      client.emit('error', { message: 'Error al validar autenticación' });
      client.disconnect();
      return { valid: false };
    }
  }
}
