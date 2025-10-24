import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private readonly apiBaseUrl = 'http://localhost:5000';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let modifiedRequest = req;
    const attachable = this.shouldAttachToken(req.url);
    const accessToken = this.authService.getAccessToken();

    if (attachable && accessToken) {
      modifiedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }

    return next.handle(modifiedRequest).pipe(
      catchError(error => {
        if (error.status !== 401 || !attachable || this.isAuthEndpoint(req.url)) {
          return throwError(() => error);
        }

        return this.authService.refreshAccessToken().pipe(
          switchMap(token => {
            const retryRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
            return next.handle(retryRequest);
          }),
          catchError(refreshError => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      })
    );
  }

  private shouldAttachToken(url: string): boolean {
    return url.startsWith(this.apiBaseUrl) && !this.isAuthEndpoint(url);
  }

  private isAuthEndpoint(url: string): boolean {
    const normalized = url.toLowerCase();
    return normalized.includes('/auth/login') || normalized.includes('/auth/refresh');
  }
}