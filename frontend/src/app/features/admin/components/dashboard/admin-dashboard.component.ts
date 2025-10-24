import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService, AuthSession } from '../../../../core/services/auth.service';

interface AdminDashboardViewModel {
  adminName: string;
  lastAccessLabel: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly viewModel$: Observable<AdminDashboardViewModel | null> = this.authService.session$.pipe(
    map((session: AuthSession | null) => {
      if (!session) {
        return null;
      }

      const formatter = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      return {
        adminName: session.user.name,
        lastAccessLabel: formatter.format(new Date(session.lastAccess ?? Date.now()))
      };
    })
  );
}
