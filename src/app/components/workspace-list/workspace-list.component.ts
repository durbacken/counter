import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { FooterComponent } from '../footer/footer.component';
import { Category, Workspace, WorkspaceMode } from '../../models/counter.model';

@Component({
  selector: 'app-workspace-list',
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FooterComponent,
  ],
  templateUrl: './workspace-list.component.html',
  styleUrl: './workspace-list.component.scss'
})
export class WorkspaceListComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly user$ = this.auth.user$;
  readonly workspaces$ = this.auth.user$.pipe(
    filter(user => !!user),
    switchMap(user => this.workspaceService.getWorkspaces(user!.uid).pipe(
      catchError(() => of([]))
    ))
  );

  installPrompt: any = null;
  showIosHint = false;
  featureHintVisible = false;
  private featureHintTimer: ReturnType<typeof setTimeout> | null = null;

  onFeatureCardClick(): void {
    if (this.featureHintTimer) clearTimeout(this.featureHintTimer);
    this.featureHintVisible = true;
    this.featureHintTimer = setTimeout(() => { this.featureHintVisible = false; }, 2500);
  }
  private readonly onBeforeInstall = (e: Event) => {
    e.preventDefault();
    this.installPrompt = e;
  };

  showExamplePicker = false;
  showArchived = false;

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.addEventListener('appinstalled', () => { this.installPrompt = null; });

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = ('standalone' in navigator) && (navigator as any).standalone;
    const dismissed = localStorage.getItem('iosHintDismissed');
    if (isIos && !isStandalone && !dismissed) {
      this.showIosHint = true;
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstall);
    if (this.featureHintTimer) clearTimeout(this.featureHintTimer);
  }

  dismissIosHint(): void {
    this.showIosHint = false;
    localStorage.setItem('iosHintDismissed', '1');
  }

  async promptInstall(): Promise<void> {
    if (!this.installPrompt) return;
    this.installPrompt.prompt();
    await this.installPrompt.userChoice;
    this.installPrompt = null;
  }

  startNew(mode: WorkspaceMode): void {
    this.router.navigate(['/new', mode]);
  }

  // ── Swipe-to-reveal state ──────────────────────────────
  swipedId: string | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent, id: string): void {
    if (this.swipedId && this.swipedId !== id) {
      this.swipedId = null;
    }
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent, id: string): void {
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) < Math.abs(dy)) return;
    if (dx < -60) {
      this.swipedId = id;
    } else if (dx > 20 && this.swipedId === id) {
      this.swipedId = null;
    }
  }

  onCardClick(ws: Workspace): void {
    if (this.swipedId === ws.id) {
      this.swipedId = null;
      return;
    }
    this.router.navigate(['/workspace', ws.id]);
  }

  confirmAction(ws: Workspace, uid: string): void {
    this.swipedId = null;
    if (this.isOwner(ws, uid)) {
      this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Arkivera',
          message: `Vill du arkivera "${ws.title}"? Du kan återställa den i inställningarna.`
        }
      }).afterClosed().subscribe(async confirmed => {
        if (confirmed) await this.workspaceService.archiveWorkspace(ws.id);
      });
    } else {
      this.dialog.open(ConfirmDialogComponent, {
        data: { title: 'Lämna', message: `Vill du lämna "${ws.title}"?` }
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

  openAbout(): void {
    this.dialog.open(AboutDialogComponent, { maxWidth: '380px' });
  }

  signOut(): void {
    this.auth.signOut();
  }
}
