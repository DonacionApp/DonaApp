import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService, AuthSession } from '../../../../core/services/auth.service';

interface OrganizationDashboardViewModel {
  organizationName: string;
  lastAccessLabel: string;
}

@Component({
  selector: 'app-organization-dashboard',
  templateUrl: './organization-dashboard.component.html',
  styleUrls: ['./organization-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly viewModel$: Observable<OrganizationDashboardViewModel | null> = this.authService.session$.pipe(
    map((session: AuthSession | null) => {
      if (!session) {
        return null;
      }

      const formatter = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      return {
        organizationName: session.user.name,
        lastAccessLabel: formatter.format(new Date(session.lastAccess ?? Date.now()))
      };
    })
  );
}
