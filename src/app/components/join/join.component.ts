import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, filter, take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';

@Component({
  selector: 'app-join',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="join-page">
      @if (state === 'loading') {
        <mat-spinner diameter="48" />
        <p>Går med i arbetsytan…</p>
      } @else if (state === 'success') {
        <mat-icon class="icon-success">check_circle</mat-icon>
        <h2>Du är med!</h2>
        <p>Du har lagts till som medlem.</p>
        <button mat-flat-button color="primary" (click)="goToWorkspace()">Öppna</button>
      } @else if (state === 'error') {
        <mat-icon class="icon-error">error</mat-icon>
        <h2>Något gick fel</h2>
        <p>{{ errorMessage }}</p>
        <button mat-button (click)="goHome()">Till startsidan</button>
      }
    </div>
  `,
  styles: [`
    .join-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px 24px;
      text-align: center;
    }

    .icon-success { font-size: 64px; width: 64px; height: 64px; color: #43a047; }
    .icon-error   { font-size: 64px; width: 64px; height: 64px; color: #e53935; }

    h2 { margin: 0; font-size: 22px; }
    p  { margin: 0; color: var(--text-secondary); }
  `]
})
export class JoinComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly workspaceService = inject(WorkspaceService);

  state: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = '';
  private workspaceId = '';
  private token = '';

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.token       = this.route.snapshot.paramMap.get('token') ?? '';

    this.auth.user$.pipe(
      filter(u => u !== undefined),
      take(1)
    ).subscribe(user => {
      if (!user) {
        // Save the intended join URL and redirect to login
        sessionStorage.setItem('pendingJoin', this.router.url);
        this.router.navigate(['/login']);
      } else {
        this.doJoin(user.uid, user.email ?? (user.isAnonymous ? 'Gäst' : ''));
      }
    });
  }

  private async doJoin(uid: string, email: string): Promise<void> {
    try {
      await this.workspaceService.joinWorkspace(this.workspaceId, this.token, uid, email);
      this.state = 'success';
    } catch (e: any) {
      this.state = 'error';
      this.errorMessage = e.message ?? 'Inbjudningslänken är ogiltig eller har gått ut.';
    }
  }

  goToWorkspace(): void {
    this.router.navigate(['/workspace', this.workspaceId]);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
