import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

type Mode = 'signin' | 'register' | 'forgot';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  error = '';
  mode: Mode = 'signin';
  resetSent = false;
  showPassword = false;
  signInFailed = false;
  featureHintVisible = false;
  completingLink = false;
  readonly inAppBrowser = this.auth.isInAppBrowser();

  emailInput = '';
  passwordInput = '';

  private featureHintTimer: ReturnType<typeof setTimeout> | null = null;

  onFeatureCardClick(): void {
    if (this.featureHintTimer) clearTimeout(this.featureHintTimer);
    this.featureHintVisible = true;
    this.featureHintTimer = setTimeout(() => { this.featureHintVisible = false; }, 2500);
  }

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

    const tipEmail = this.route.snapshot.queryParamMap.get('email');
    if (tipEmail) {
      this.emailInput = tipEmail;
      this.mode = 'register';
    }

    if (this.auth.googleRedirectPending) {
      this.completingLink = true;
      this.auth.checkRedirectResult()
        .then(found => { if (!found) this.completingLink = false; })
        .catch(() => {
          this.error = 'Inloggningen misslyckades. Försök igen.';
          this.completingLink = false;
        });
    }
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    this.error = '';
    this.resetSent = false;
    this.signInFailed = false;
    this.passwordInput = '';
    this.showPassword = false;
  }

  async signIn(): Promise<void> {
    const email = this.emailInput.trim();
    if (!email || !this.passwordInput) return;
    this.loading = true;
    this.error = '';
    this.signInFailed = false;
    try {
      await this.auth.signInWithPassword(email, this.passwordInput);
    } catch (e: any) {
      this.error = this.friendlyError(e.code);
      this.signInFailed = true;
    } finally {
      this.loading = false;
    }
  }

  async register(): Promise<void> {
    const email = this.emailInput.trim();
    if (!email || !this.passwordInput) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.createAccount(email, this.passwordInput);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        // Account exists (possibly via Google or old magic link) — guide them
        // to set a password via the reset flow, which works for all providers.
        this.setMode('forgot');
        this.error = 'Det finns redan ett konto med den adressen. Skicka en återställningslänk för att sätta ett lösenord.';
      } else {
        this.error = this.friendlyError(e.code);
      }
    } finally {
      this.loading = false;
    }
  }

  async sendReset(): Promise<void> {
    const email = this.emailInput.trim();
    if (!email) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.sendPasswordReset(email);
      this.resetSent = true;
    } catch (e: any) {
      this.error = this.friendlyError(e.code);
    } finally {
      this.loading = false;
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

  private friendlyError(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Fel e-postadress eller lösenord.';
      case 'auth/email-already-in-use':
        return 'Det finns redan ett konto med den e-postadressen.';
      case 'auth/weak-password':
        return 'Lösenordet måste vara minst 6 tecken.';
      case 'auth/invalid-email':
        return 'Ogiltig e-postadress.';
      case 'auth/too-many-requests':
        return 'För många försök. Vänta en stund och försök igen.';
      default:
        return 'Något gick fel. Försök igen.';
    }
  }
}
