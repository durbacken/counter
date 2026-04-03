import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';

@Component({
  selector: 'app-footer',
  imports: [MatIconModule],
  template: `
    <footer class="footer" (click)="openAbout()" role="button" tabindex="0"
            (keydown.enter)="openAbout()" aria-label="Om Koll på läget?">
      <img src="icons/icon-192x192.png" class="footer-logo" alt="" />
      Koll på läget? &nbsp;·&nbsp; &copy; {{ year }} Durbacken Design
      <mat-icon class="mail-icon">mail</mat-icon>
    </footer>
  `,
  styles: [`
    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 16px;
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      font-size: 12px;
      color: #bdbdbd;
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition: color 0.15s ease;

      &:hover { color: #9e9e9e; }
    }

    .footer-logo {
      display: block;
      align-self: center;
      width: 12px;
      height: 12px;
      border-radius: 3px;
      filter: grayscale(1);
      opacity: 0.5;
      margin-bottom: 1px;
    }

    .mail-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
      line-height: 12px;
    }
  `]
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  private readonly dialog = inject(MatDialog);

  openAbout(): void {
    this.dialog.open(AboutDialogComponent, { maxWidth: '380px' });
  }
}
