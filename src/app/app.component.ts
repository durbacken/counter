import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallBannerComponent } from './components/install-banner/install-banner.component';
import { AuthService } from './services/auth.service';

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
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.handleRedirectResult();
  }
}
