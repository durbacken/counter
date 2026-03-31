import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  error = '';

  ngOnInit(): void {
    // Navigate to app once authState confirms the user is signed in.
    // This avoids a race condition where router.navigate fires before
    // Firebase has emitted the updated auth state, causing the guard
    // to see null and bounce back to /login.
    this.auth.user$.pipe(
      filter(user => !!user),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.router.navigate(['/']));
  }

  async signIn(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.error = 'Inloggningen misslyckades. Försök igen.';
      this.loading = false;
    }
  }
}
