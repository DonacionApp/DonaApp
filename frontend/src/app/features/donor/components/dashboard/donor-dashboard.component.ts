import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService, AuthSession } from '../../../../core/services/auth.service';

interface DonorDashboardViewModel {
  name: string;
  lastAccessLabel: string;
}

@Component({
  selector: 'app-donor-dashboard',
  templateUrl: './donor-dashboard.component.html',
  styleUrls: ['./donor-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly viewModel$: Observable<DonorDashboardViewModel | null> = this.authService.session$.pipe(
    map((session: AuthSession | null) => {
      if (!session) {
        return null;
      }

      const formatter = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      return {
        name: session.user.name,
        lastAccessLabel: formatter.format(new Date(session.lastAccess ?? Date.now()))
      };
    })
  );
}
