import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, User, authState, createUserWithEmailAndPassword, getRedirectResult, sendPasswordResetEmail, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut } from '@angular/fire/auth';
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

  async checkRedirectResult(): Promise<boolean> {
    const result = await getRedirectResult(this.auth);
    sessionStorage.removeItem('googleRedirectPending');
    if (result?.user) {
      await this.onSignIn(result.user);
      return true;
    }
    return false;
  }

  isInAppBrowser(): boolean {
    const ua = navigator.userAgent;
    // Known in-app browser signals
    if (/Instagram|FBAN|FBAV|LinkedInApp|WhatsApp|Snapchat|TikTok/i.test(ua)) return true;
    // iOS in-app browser: has iPhone/iPad but is missing Safari token
    if (/iPhone|iPad/i.test(ua) && !/Safari/i.test(ua)) return true;
    return false;
  }

  get googleRedirectPending(): boolean {
    return sessionStorage.getItem('googleRedirectPending') === '1';
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.onSignIn(result.user);
  }

  async createAccount(email: string, password: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.onSignIn(result.user);
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email, {
      url: environment.appUrl + '/login',
    });
  }

  async signInAsGuest(): Promise<void> {
    await signInAnonymously(this.auth);
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
