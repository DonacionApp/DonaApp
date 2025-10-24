import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, AuthSession, LoginPayload } from '../../../../core/services/auth.service';
import { SharedModule } from '../../../../shared/shared.module';

const LOCK_FALLBACK_SECONDS = 30;
type AccountType = 'donor' | 'organization';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnDestroy {
  readonly accountTypes: AccountType[] = ['donor', 'organization'];
  readonly demoAccounts = [
    'contacto@ayudasocial.org',
    'info@esperanza.org',
    'centro@sanjose.org'
  ];

  isSubmitting = false;
  feedbackMessage = '';
  isSuccess = false;
  lockSecondsRemaining = 0;
  lastAccess?: string;
  readonly now = new Date();

  private readonly destroy$ = new Subject<void>();
  private lockCountdownSub?: Subscription;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly loginForm = this.fb.nonNullable.group({
    role: this.fb.control<AccountType>('donor', { validators: [Validators.required] }),
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true
    }),
    password: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true
    })
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopLockCountdown();
  }

  get isLocked(): boolean {
    return this.lockSecondsRemaining > 0;
  }

  selectAccountType(role: AccountType): void {
    this.loginForm.patchValue({ role });
  }

  submit(): void {
    if (this.isLocked) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.feedbackMessage = '';
    this.isSuccess = false;
    this.isSubmitting = true;

    const { email, password } = this.loginForm.getRawValue();
    const payload: LoginPayload = { email, password };

    this.authService
      .login(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session: AuthSession) => this.handleSuccessfulLogin(session),
        error: (error: unknown) => {
          this.handleLoginError(error);
        }
      });
  }

  getEmailError(): string | null {
    const control = this.loginForm.controls.email;
    if (!control.touched && !control.dirty) {
      return null;
    }

    if (control.hasError('required')) {
      return 'El correo es obligatorio';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo válido';
    }

    return null;
  }

  getPasswordError(): string | null {
    const control = this.loginForm.controls.password;
    if (!control.touched && !control.dirty) {
      return null;
    }

    if (control.hasError('required')) {
      return 'La contraseña es obligatoria';
    }

    if (control.hasError('minlength')) {
      return 'Debe tener al menos 6 caracteres';
    }

    return null;
  }

  private handleSuccessfulLogin(session: AuthSession): void {
    this.isSubmitting = false;
    this.isSuccess = true;
    this.lastAccess = session.lastAccess;
    this.feedbackMessage = 'Sesión iniciada correctamente';
    this.authService.updateLastAccess(session.lastAccess);
  }

  private handleLoginError(error: unknown): void {
    this.isSubmitting = false;

    if (!(error instanceof HttpErrorResponse)) {
      this.feedbackMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.';
      return;
    }

    if (error.status === 429) {
      this.feedbackMessage = 'Demasiados intentos. Intenta nuevamente cuando termine la cuenta regresiva.';
      const retryAfterHeader = Number(error.headers?.get('Retry-After'));
      const retryAfterPayload = Number((error.error && error.error.retryAfterSeconds) ?? NaN);
      const duration = Number.isFinite(retryAfterHeader)
        ? retryAfterHeader
        : Number.isFinite(retryAfterPayload)
          ? retryAfterPayload
          : LOCK_FALLBACK_SECONDS;
      this.startLockCountdown(duration);
      return;
    }

    if (error.status === 401) {
      this.feedbackMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      this.loginForm.controls.password.reset();
      return;
    }

    this.feedbackMessage = error.error?.message ?? 'No fue posible iniciar sesión.';
  }

  private startLockCountdown(seconds: number): void {
    this.stopLockCountdown();
    this.lockSecondsRemaining = Math.max(Math.floor(seconds), 1);

    this.lockCountdownSub = timer(1000, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lockSecondsRemaining = Math.max(this.lockSecondsRemaining - 1, 0);
        if (this.lockSecondsRemaining === 0) {
          this.stopLockCountdown();
        }
      });
  }

  private stopLockCountdown(): void {
    if (this.lockCountdownSub) {
      this.lockCountdownSub.unsubscribe();
      this.lockCountdownSub = undefined;
    }
  }
}
