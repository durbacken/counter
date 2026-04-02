import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-about-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content class="about-content">
      <img src="icons/icon-192x192.png" class="about-logo" alt="Koll på läget?" />
      <h2 class="app-name">Koll på läget?</h2>
      <p class="byline">&copy; {{ year }} Durbacken Design</p>

      <p class="intro">
        Hej! Jag heter <strong>Tobias Sjöbeck</strong> och det är jag som
        har byggt <strong>Koll på läget?</strong> som ett litet hobbyprojekt på fritiden.
      </p>

      <p>
        Har du feedback, hittat en bugg eller vill du bara säga hej?
        Hör gärna av dig — det uppskattas!
      </p>

      <a href="mailto:tobias.sjobeck&#64;gmail.com" class="email-link">
        tobias.sjobeck&#64;gmail.com
      </a>

      <p class="sign-off">
        Hoppas du gillar appen och har nytta av den!<br />
        <em>— Tobbe</em>
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="close()">Tack, det gör jag!</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .about-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 16px 0;
      max-width: 340px;
    }

    .about-logo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .app-name {
      font-size: 22px;
      font-weight: 300;
      margin: 0 0 4px;
      color: var(--text-secondary);
    }

    .byline {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0 0 16px;
    }

    p {
      font-size: 14px;
      line-height: 1.65;
      color: var(--text-primary);
      margin: 0 0 12px;
    }

    .email-link {
      display: inline-block;
      font-size: 14px;
      color: #1976d2;
      margin-bottom: 16px;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .sign-off {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }
  `]
})
export class AboutDialogComponent {
  readonly ref = inject(MatDialogRef<AboutDialogComponent>);
  readonly year = new Date().getFullYear();
  close(): void { this.ref.close(); }
}
