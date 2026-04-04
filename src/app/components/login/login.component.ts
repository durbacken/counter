import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  error = '';
  featureHintVisible = false;
  private featureHintTimer: ReturnType<typeof setTimeout> | null = null;

  onFeatureCardClick(): void {
    if (this.featureHintTimer) clearTimeout(this.featureHintTimer);
    this.featureHintVisible = true;
    this.featureHintTimer = setTimeout(() => { this.featureHintVisible = false; }, 2500);
  }

  // Magic link states
  emailInput = '';
  linkSent = false;
  needsEmailConfirm = false;   // opened link on different device
  completingLink = false;
  pastedLink = '';

  ngOnInit(): void {
    this.auth.user$.pipe(
      filter(user => !!user),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      const pending = sessionStorage.getItem('pendingJoin');
      if (pending) {
        sessionStorage.removeItem('pendingJoin');
        this.router.navigateByUrl(pending);
      } else {
        this.router.navigate(['/']);
      }
    });

    if (this.auth.isEmailLink()) {
      const saved = this.auth.getSavedEmail();
      if (saved) {
        this.completingLink = true;
        this.auth.completeEmailLink(saved).catch(() => {
          this.error = 'Inloggningslänken är ogiltig eller har gått ut. Försök igen.';
          this.completingLink = false;
        });
      } else {
        this.needsEmailConfirm = true;
      }
    } else if (this.auth.googleRedirectPending) {
      // Returning from Google redirect (iOS PWA flow)
      this.completingLink = true;
      this.auth.checkRedirectResult().catch(() => {
        this.error = 'Inloggningen misslyckades. Försök igen.';
        this.completingLink = false;
      });
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.error = 'Inloggningen misslyckades. Försök igen.';
      this.loading = false;
    }
  }

  async signInWithPastedLink(): Promise<void> {
    const url = this.pastedLink.trim();
    if (!url || !this.emailInput) return;
    this.completingLink = true;
    this.error = '';
    try {
      await this.auth.completeEmailLink(this.emailInput, url);
    } catch {
      this.error = 'Länken är ogiltig eller har gått ut. Försök igen.';
      this.completingLink = false;
    }
  }

  async signInAsGuest(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signInAsGuest();
    } catch {
      this.error = 'Kunde inte starta gästläge. Försök igen.';
      this.loading = false;
    }
  }

  async sendMagicLink(): Promise<void> {
    const email = this.emailInput.trim();
    if (!email) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.sendMagicLink(email);
      this.linkSent = true;
    } catch (e: any) {
      if (e?.code === 'auth/quota-exceeded') {
        this.error = 'För många inloggningsförsök idag. Försök igen imorgon eller logga in med Google.';
      } else {
        this.error = 'Kunde inte skicka länken. Kontrollera e-postadressen och försök igen.';
      }
    } finally {
      this.loading = false;
    }
  }

  async confirmEmailAndComplete(): Promise<void> {
    const email = this.emailInput.trim();
    if (!email) return;
    this.completingLink = true;
    this.error = '';
    try {
      await this.auth.completeEmailLink(email);
    } catch {
      this.error = 'Inloggningslänken är ogiltig eller har gått ut. Försök igen.';
      this.completingLink = false;
      this.needsEmailConfirm = false;
    }
  }
}
