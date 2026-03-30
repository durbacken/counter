import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/main/main.component').then(m => m.MainComponent)
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then(m => m.AdminComponent)
  },
  { path: '**', redirectTo: '' }
];
