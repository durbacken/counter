import { Component, OnInit, inject, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InstallBannerComponent } from './components/install-banner/install-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallBannerComponent],
  template: `
    <router-outlet />
    <app-install-banner />
  `,
  styles: [':host { display: block; min-height: 100dvh; }']
})
export class AppComponent implements OnInit {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackbar = inject(MatSnackBar);

  ngOnInit(): void {
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
}
