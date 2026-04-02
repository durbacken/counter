import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '@angular/fire/auth';

/** Minimal fake user – only the fields the app actually reads. */
const DEV_USER = {
  uid: 'dev-local',
  email: 'dev@localhost',
  displayName: 'Dev User',
} as unknown as User;

/**
 * Drop-in replacement for AuthService used in dev mode.
 * Emits a pre-signed-in user immediately so the auth guard passes
 * and the login screen auto-navigates to the workspace list.
 * No Firebase involved.
 */
@Injectable()
export class DevAuthService {
  private readonly router = inject(Router);

  private readonly userSubject = new BehaviorSubject<User | null>(DEV_USER);
  readonly user$ = this.userSubject.asObservable();

  async signInWithGoogle(): Promise<void> {
    this.userSubject.next(DEV_USER);
  }

  async sendMagicLink(_email: string): Promise<void> {}
  async completeEmailLink(_email: string): Promise<void> {}
  isEmailLink(): boolean { return false; }
  getSavedEmail(): string | null { return null; }

  async signOut(): Promise<void> {
    this.userSubject.next(null);
    await this.router.navigate(['/login']);
  }
}
