import { Component, OnDestroy, OnInit, inject, isDevMode, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { InstallBannerComponent } from './components/install-banner/install-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallBannerComponent, MatIconModule],
  template: `
    <div class="offline-banner" [class.visible]="offline()">
      <mat-icon>wifi_off</mat-icon>
      Ingen anslutning — ändringar synkas när du är online igen
    </div>
    <router-outlet />
    <app-install-banner />
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; }

    .offline-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #424242;
      color: #fff;
      font-size: 13px;
      padding: 8px 16px;
      padding-bottom: calc(8px + env(safe-area-inset-bottom));
      transform: translateY(100%);
      transition: transform 0.25s ease;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
      &.visible { transform: translateY(0); }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackbar = inject(MatSnackBar);

  readonly offline = signal(!navigator.onLine);

  private readonly onOnline  = () => this.offline.set(false);
  private readonly onOffline = () => this.offline.set(true);

  ngOnInit(): void {
    window.addEventListener('online',  this.onOnline);
    window.addEventListener('offline', this.onOffline);

    if (isDevMode() || !this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        const snack = this.snackbar.open(
          'En ny version finns tillgänglig!',
          'Uppdatera',
          { duration: 0, horizontalPosition: 'center', verticalPosition: 'bottom' }
        );
        snack.onAction().subscribe(() => {
          this.swUpdate.activateUpdate().then(() => document.location.reload());
        });
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('online',  this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
