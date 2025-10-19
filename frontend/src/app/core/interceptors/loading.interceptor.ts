import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo mostrar loading para requests a la API
    if (req.url.includes('/api/')) {
      this.activeRequests++;
      this.loadingSubject.next(true);
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (req.url.includes('/api/')) {
          this.activeRequests--;
          if (this.activeRequests === 0) {
            this.loadingSubject.next(false);
          }
        }
      })
    );
  }

  /**
   * Obtiene el estado actual del loading
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
