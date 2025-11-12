import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AddRefreshTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const newToken = response.getHeader('X-New-Token');

    return next.handle().pipe(
      map((data) => {
        if (newToken) {
          if (typeof data === 'object' && data !== null) {
            
            console.log(' nuevo token generado y agregado al cuerpo de la respuesta +');
          } 
          console.log(` nuevo token generado pero no se pudo agregar al cuerpo de la respuesta +`);
          return data;
        }
        return data;
      }),
    );
  }
}
