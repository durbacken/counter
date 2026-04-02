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
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { FooterComponent } from '../footer/footer.component';
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
    FooterComponent,
  ],
  templateUrl: './workspace-list.component.html',
  styleUrl: './workspace-list.component.scss'
})
export class WorkspaceListComponent {
  private readonly auth = inject(AuthService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly user$ = this.auth.user$;
  readonly workspaces$ = this.auth.user$.pipe(
    switchMap(user => this.workspaceService.getWorkspaces(user!.uid))
  );

  newWorkspaceTitle = '';
  newWorkspaceMode: WorkspaceMode = 'counter';
  showNewForm = false;
  showExamplePicker = false;
  showArchived = false;

  // ── Swipe-to-reveal state ──────────────────────────────
  swipedId: string | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent, id: string): void {
    if (this.swipedId && this.swipedId !== id) {
      this.swipedId = null; // close any other open card
    }
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent, id: string): void {
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;

    // Only act on clearly horizontal swipes
    if (Math.abs(dx) < Math.abs(dy)) return;

    if (dx < -60) {
      this.swipedId = id; // reveal action
    } else if (dx > 20 && this.swipedId === id) {
      this.swipedId = null; // swipe right to close
    }
  }

  onCardClick(ws: Workspace): void {
    if (this.swipedId === ws.id) {
      this.swipedId = null; // tapping swiped card closes it
      return;
    }
    this.open(ws);
  }

  // ── Actions ───────────────────────────────────────────
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

  confirmAction(ws: Workspace, uid: string): void {
    this.swipedId = null;
    if (this.isOwner(ws, uid)) {
      this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Arkivera arbetsyta',
          message: `Vill du arkivera "${ws.title}"? Du kan återställa den i inställningarna.`
        }
      }).afterClosed().subscribe(async confirmed => {
        if (confirmed) await this.workspaceService.archiveWorkspace(ws.id);
      });
    } else {
      this.dialog.open(ConfirmDialogComponent, {
        data: { title: 'Lämna arbetsyta', message: `Vill du lämna "${ws.title}"?` }
      }).afterClosed().subscribe(async confirmed => {
        if (confirmed) await this.workspaceService.removeMember(ws.id, uid, ws.members, ws.memberEmails);
      });
    }
  }

  async restoreWorkspace(ws: Workspace): Promise<void> {
    await this.workspaceService.restoreWorkspace(ws.id);
  }

  confirmPermanentDelete(ws: Workspace): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Radera permanent', message: `Radera "${ws.title}" för alltid? Denna åtgärd kan inte ångras.` }
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) await this.workspaceService.deleteWorkspace(ws.id);
    });
  }

  activeWorkspaces(workspaces: Workspace[]): Workspace[] {
    return workspaces.filter(ws => !ws.archived);
  }

  archivedWorkspaces(workspaces: Workspace[]): Workspace[] {
    return workspaces.filter(ws => !!ws.archived);
  }

  isOwner(workspace: Workspace, uid: string): boolean {
    return workspace.ownerId === uid;
  }

  checkedCount(categories: Category[]): number {
    return categories.filter(c => c.checked).length;
  }

  async createExample(mode: WorkspaceMode): Promise<void> {
    const user = await firstValueFrom(this.user$);
    if (!user) return;
    const examples: Record<WorkspaceMode, { title: string; names: string[] }> = {
      counter: { title: 'Daglig räknare', names: ['Kaffe', 'Möten', 'Pauser', 'Samtal'] },
      checkbox: { title: 'Att göra', names: ['Handla mat', 'Betala räkningar', 'Städa', 'Ring läkaren'] },
    };
    const { title, names } = examples[mode];
    const id = await this.workspaceService.createWorkspace(title, user.uid, user.email!, mode);
    const categories: Category[] = names.map(name => ({ id: crypto.randomUUID(), name, count: 0 }));
    await this.workspaceService.updateCategories(id, categories);
    this.router.navigate(['/workspace', id]);
  }

  signOut(): void {
    this.auth.signOut();
  }
}
