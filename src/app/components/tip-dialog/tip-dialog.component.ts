import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { environment } from '../../../environments/environment';

interface TipDialogData {
  fromName: string;
  fromEmail: string;
}

@Component({
  selector: 'app-tip-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Tipsa om appen</h2>
    <mat-dialog-content>
      @if (sent) {
        <div class="sent-state">
          <mat-icon class="sent-icon">check_circle</mat-icon>
          <p>Tips skickat till <strong>{{ toEmail }}</strong>!</p>
          <p class="sent-sub">De får ett mail med en länk för att skapa konto direkt.</p>
        </div>
      } @else {

        <!-- ─── Share link ──────────────────────────── -->
        <div class="section">
          <p class="section-label">Dela med vem som helst</p>
          <button mat-flat-button color="primary" class="share-btn" (click)="shareLink()">
            <mat-icon>share</mat-icon>
            Dela länk
          </button>
          <p class="link-hint muted">
            <mat-icon class="hint-icon">group</mat-icon>
            Öppnar delningsmenyn — skicka via SMS, Mail, WhatsApp eller annat.
          </p>
        </div>

        <div class="divider"><span>eller tipsa direkt via e-post</span></div>

        <!-- ─── Email tip ───────────────────────────── -->
        <div class="section">
          <p class="section-label">Skicka personligt tips</p>
          <div class="invite-row">
            <mat-form-field appearance="outline" class="invite-field">
              <mat-label>Mottagarens e-postadress</mat-label>
              <input matInput [(ngModel)]="toEmail" type="email" name="tip-email"
                     autocomplete="off" (keydown.enter)="send()"
                     placeholder="namn&#64;exempel.se" />
            </mat-form-field>
            <button mat-flat-button color="primary" class="invite-btn"
                    [disabled]="!toEmail.trim() || sending"
                    (click)="send()">
              @if (sending) { <mat-spinner diameter="20" /> }
              @else { Skicka }
            </button>
          </div>
          @if (error) {
            <p class="error">{{ error }}</p>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Stäng</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 0;
    }

    .section-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      margin: 0;
    }

    .share-btn { width: 100%; }

    .link-hint {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      margin: 0;
      line-height: 1.45;
      &.muted { color: var(--text-secondary); }
    }

    .hint-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 1px;
      color: #1976d2;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      color: var(--text-secondary);
      font-size: 12px;

      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--divider); }
    }

    .invite-row { display: flex; gap: 8px; align-items: flex-start; }
    .invite-field { flex: 1; }
    .invite-btn { height: 56px; flex-shrink: 0; }

    .error { color: #c62828; font-size: 13px; margin: -8px 0 8px; }

    .sent-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 0 8px;
      text-align: center;

      .sent-icon { font-size: 48px; width: 48px; height: 48px; color: #43a047; }
      p { margin: 0; font-size: 15px; }
      .sent-sub { font-size: 13px; color: var(--text-secondary); }
    }
  `]
})
export class TipDialogComponent {
  readonly data = inject<TipDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<TipDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  toEmail = '';
  sending = false;
  sent = false;
  error = '';

  private get appLink(): string {
    const email = encodeURIComponent(this.toEmail.trim());
    return `${environment.appUrl}/login?email=${email}`;
  }

  async send(): Promise<void> {
    const email = this.toEmail.trim();
    if (!email) return;
    this.sending = true;
    this.error = '';
    try {
      const { default: emailjs } = await import('@emailjs/browser');
      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.tipTemplateId,
        {
          to_email: email,
          from_name: this.data.fromName,
          from_email: this.data.fromEmail,
          app_link: this.appLink,
        },
        environment.emailjs.publicKey
      );
      this.sent = true;
    } catch {
      this.error = 'Kunde inte skicka tips. Försök igen.';
    } finally {
      this.sending = false;
    }
  }

  shareLink(): void {
    const url = environment.appUrl + '/login';
    const text = `${this.data.fromName} tipsar om Koll på läget? — ett enkelt sätt att hålla koll på saker tillsammans i realtid.`;
    if (navigator.share) {
      navigator.share({ title: 'Koll på läget?', text, url }).catch(() => {});
    } else {
      this.clipboard.copy(url);
      this.snackBar.open('Länk kopierad!', undefined, { duration: 2500 });
    }
  }
}
