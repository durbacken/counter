import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth, GoogleAuthProvider, authState,
  signInWithRedirect, getRedirectResult, signOut
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  readonly user$ = authState(this.auth);

  /** Navigates the page to Google's sign-in flow. */
  async signInWithGoogle(): Promise<void> {
    await signInWithRedirect(this.auth, new GoogleAuthProvider());
  }

  /**
   * Must be called once on app startup.
   * Processes the result when Google redirects back to the app
   * and saves the user profile to Firestore.
   */
  async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (!result) return;
      await setDoc(doc(this.firestore, 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }, { merge: true });
    } catch {
      // Redirect result errors are non-fatal; user will see the login screen again
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }
}
