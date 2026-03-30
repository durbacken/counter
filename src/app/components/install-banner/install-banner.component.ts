import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const DISMISSED_KEY = 'install_banner_dismissed';

@Component({
  selector: 'app-install-banner',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './install-banner.component.html',
  styleUrl: './install-banner.component.scss'
})
export class InstallBannerComponent implements OnInit, OnDestroy {
  visible = false;
  isIos = false;

  private deferredPrompt: any = null;
  private readonly onBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    this.deferredPrompt = e;
    this.visible = true;
  };

  ngOnInit(): void {
    // Already running as installed PWA — nothing to do
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // User already dismissed the banner
    if (localStorage.getItem(DISMISSED_KEY)) return;

    this.isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (this.isIos) {
      // iOS has no install event — show instructions immediately
      this.visible = true;
    } else {
      window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.dismiss();
  }

  dismiss(): void {
    this.visible = false;
    localStorage.setItem(DISMISSED_KEY, '1');
  }
}
