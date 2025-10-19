import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && req.url.startsWith('/api/')) {
      // Agregar token de autorización a las requests a la API
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.id}` // Ajustar según tu implementación de tokens
        }
      });
    }

    return next.handle(req);
  }
}