import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/workspace-list/workspace-list.component').then(m => m.WorkspaceListComponent)
  },
  {
    path: 'workspace/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/main/main.component').then(m => m.MainComponent)
  },
  {
    path: 'workspace/:id/admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/admin/admin.component').then(m => m.AdminComponent)
  },
  { path: '**', redirectTo: '' }
];
