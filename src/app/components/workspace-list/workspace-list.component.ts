import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { Category, Workspace, WorkspaceMode } from '../../models/counter.model';

@Component({
  selector: 'app-workspace-list',
  imports: [
    AsyncPipe,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
  ],
  templateUrl: './workspace-list.component.html',
  styleUrl: './workspace-list.component.scss'
})
export class WorkspaceListComponent {
  private readonly auth = inject(AuthService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);

  readonly user$ = this.auth.user$;
  readonly workspaces$ = this.auth.user$.pipe(
    switchMap(user => this.workspaceService.getWorkspaces(user!.uid))
  );

  newWorkspaceTitle = '';
  newWorkspaceMode: WorkspaceMode = 'counter';
  showNewForm = false;

  open(workspace: Workspace): void {
    this.router.navigate(['/workspace', workspace.id]);
  }

  async createWorkspace(): Promise<void> {
    const title = this.newWorkspaceTitle.trim();
    if (!title) return;
    const user = await firstValueFrom(this.user$);
    const id = await this.workspaceService.createWorkspace(
      title, user!.uid, user!.email!, this.newWorkspaceMode
    );
    this.newWorkspaceTitle = '';
    this.newWorkspaceMode = 'counter';
    this.showNewForm = false;
    this.router.navigate(['/workspace', id]);
  }

  isOwner(workspace: Workspace, uid: string): boolean {
    return workspace.ownerId === uid;
  }

  checkedCount(categories: Category[]): number {
    return categories.filter(c => c.checked).length;
  }

  signOut(): void {
    this.auth.signOut();
  }
}
