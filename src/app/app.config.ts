import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';
import { WorkspaceService } from './services/workspace.service';
import { DevAuthService } from './services/dev-auth.service';
import { DevWorkspaceService } from './services/dev-workspace.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    // In dev mode, swap Firebase-backed services for lightweight localStorage
    // implementations. No emulators or network required.
    ...(isDevMode() ? [
      { provide: AuthService, useClass: DevAuthService },
      { provide: WorkspaceService, useClass: DevWorkspaceService },
    ] : []),
  ]
};
