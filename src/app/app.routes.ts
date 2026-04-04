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
    path: 'new/:mode',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/new-workspace/new-workspace.component').then(m => m.NewWorkspaceComponent)
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
  {
    path: 'view/:id',
    loadComponent: () =>
      import('./components/workspace-view/workspace-view.component').then(m => m.WorkspaceViewComponent)
  },
  {
    path: 'join/:id/:token',
    loadComponent: () =>
      import('./components/join/join.component').then(m => m.JoinComponent)
  },
  {
    path: 'owner',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/owner/owner.component').then(m => m.OwnerComponent)
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./components/about-page/about-page.component').then(m => m.AboutPageComponent)
  },
  { path: '**', redirectTo: '' }
];
