import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, User, authState, getRedirectResult, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, signInWithRedirect, signOut } from '@angular/fire/auth';
import { environment } from '../../environments/environment';
import {
  Firestore, collection, doc, getDocs, query,
  setDoc, updateDoc, where, arrayUnion
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  readonly user$ = authState(this.auth);

  async signInWithGoogle(): Promise<void> {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (('standalone' in navigator) && (navigator as any).standalone);
    if (isStandalone) {
      // In PWA/standalone mode use redirect so auth completes within the same
      // WebKit context. Mark the pending redirect so the login page can show
      // a spinner when we return.
      sessionStorage.setItem('googleRedirectPending', '1');
      await signInWithRedirect(this.auth, new GoogleAuthProvider());
      // Page navigates away — no further code runs here.
    } else {
      const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.onSignIn(result.user);
    }
  }

  async checkRedirectResult(): Promise<void> {
    const result = await getRedirectResult(this.auth);
    sessionStorage.removeItem('googleRedirectPending');
    if (result?.user) {
      await this.onSignIn(result.user);
    }
  }

  get googleRedirectPending(): boolean {
    return sessionStorage.getItem('googleRedirectPending') === '1';
  }

  async sendMagicLink(email: string): Promise<void> {
    await sendSignInLinkToEmail(this.auth, email, {
      url: environment.appUrl + '/login',
      handleCodeInApp: true,
    });
    localStorage.setItem('emailForSignIn', email);
  }

  async completeEmailLink(email: string, url = window.location.href): Promise<void> {
    const result = await signInWithEmailLink(this.auth, email, url);
    localStorage.removeItem('emailForSignIn');
    await this.onSignIn(result.user);
  }

  isEmailLink(): boolean {
    return isSignInWithEmailLink(this.auth, window.location.href);
  }

  getSavedEmail(): string | null {
    return localStorage.getItem('emailForSignIn');
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }

  private async onSignIn(user: User): Promise<void> {
    // Store/update profile so others can look them up by email
    await setDoc(doc(this.firestore, 'users', user.uid), {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }, { merge: true });

    // Process any pending invites for this email address
    await this.processPendingInvites(user);
  }

  private async processPendingInvites(user: User): Promise<void> {
    if (!user.email) return;
    try {
      const snap = await getDocs(query(
        collection(this.firestore, 'invites'),
        where('email', '==', user.email.toLowerCase()),
        where('status', '==', 'pending')
      ));
      for (const invite of snap.docs) {
        const data = invite.data();
        await updateDoc(doc(this.firestore, 'workspaces', data['workspaceId']), {
          members: arrayUnion(user.uid),
          [`memberEmails.${user.uid}`]: user.email.toLowerCase()
        });
        await updateDoc(invite.ref, { status: 'accepted' });
      }
    } catch {
      // Non-fatal — don't block sign-in if invite processing fails
    }
  }
}
