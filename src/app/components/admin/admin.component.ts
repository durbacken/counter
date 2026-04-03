import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { FooterComponent } from '../footer/footer.component';
import { Category, Workspace } from '../../models/counter.model';

@Component({
  selector: 'app-admin',
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTooltipModule,
    DragDropModule,
    ClipboardModule,
    FooterComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly destroyRef = inject(DestroyRef);

  workspace: Workspace | null = null;
  currentUserId = '';
  private cachedWorkspaceId = '';

  titleInput = '';
  notesInput = '';
  private notesInitialized = false;
  private notesTimer?: ReturnType<typeof setTimeout>;
  newCategoryName = '';
  editingId: string | null = null;
  editingName = '';
  inviteEmail = '';
  inviting = false;
  knownEmails: string[] = [];

  get shareUrl(): string {
    return `${window.location.origin}/view/${this.workspaceId}`;
  }

  get filteredEmails(): string[] {
    const members = new Set(Object.values(this.workspace?.memberEmails ?? {}));
    const available = this.knownEmails.filter(e => !members.has(e));
    const lower = this.inviteEmail.toLowerCase().trim();
    if (!lower) return available;
    return available.filter(e => e.toLowerCase().includes(lower));
  }

  private get workspaceId(): string {
    return this.cachedWorkspaceId;
  }

  get isOwner(): boolean {
    return this.workspace?.ownerId === this.currentUserId;
  }

  get isAdmin(): boolean {
    return this.workspace?.admins?.includes(this.currentUserId) ?? false;
  }

  get canAccessSettings(): boolean {
    return this.isOwner || this.isAdmin;
  }

  ngOnInit(): void {
    this.cachedWorkspaceId = this.route.snapshot.paramMap.get('id')!;

    // On destroy: cancel pending debounce and flush immediately
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.notesTimer);
      this.saveNotes();
    });

    const workspace$ = this.route.paramMap.pipe(
      switchMap(params => this.workspaceService.getWorkspace(params.get('id')!))
    );

    combineLatest([this.auth.user$, workspace$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([user, workspace]) => {
        this.currentUserId = user?.uid ?? '';
        this.workspace = workspace;
        if (!this.titleInput) this.titleInput = workspace.title;
        if (!this.notesInitialized) {
          this.notesInput = workspace.notes ?? '';
          this.notesInitialized = true;
        }
        const isPrivileged = workspace.ownerId === user?.uid ||
          (workspace.admins ?? []).includes(user?.uid ?? '');
        if (user && !isPrivileged) {
          this.router.navigate(['/workspace', this.workspaceId]);
        }
        if (user && !this.knownEmails.length) {
          this.workspaceService.getWorkspaces(user.uid).pipe(take(1))
            .subscribe(workspaces => {
              this.knownEmails = [...new Set(
                workspaces.flatMap(ws => Object.values(ws.memberEmails))
              )];
            });
        }
      });
  }

  goBack(): void {
    this.saveNotes();
    this.router.navigate(['/workspace', this.workspaceId]);
  }

  saveTitle(): void {
    const title = this.titleInput.trim();
    if (title && title !== this.workspace?.title) {
      this.workspaceService.updateTitle(this.workspaceId, title);
    } else if (!title) {
      this.titleInput = this.workspace?.title ?? '';
    }
  }

  onNotesChange(): void {
    clearTimeout(this.notesTimer);
    this.notesTimer = setTimeout(() => this.saveNotes(), 800);
  }

  saveNotes(): void {
    if (!this.cachedWorkspaceId) return;
    this.workspaceService.updateNotes(this.cachedWorkspaceId, this.notesInput.trim());
  }

  togglePublic(isPublic: boolean): void {
    this.workspaceService.setPublic(this.workspaceId, isPublic);
  }

  copyShareUrl(): void {
    this.clipboard.copy(this.shareUrl);
    this.snackbar.open('Länk kopierad!', 'Stäng', { duration: 2500 });
  }

  startEdit(category: Category): void {
    this.editingId = category.id;
    this.editingName = category.name;
  }

  saveEdit(): void {
    if (!this.workspace) return;
    const name = this.editingName.trim();
    if (!name) { this.showError('Namnet får inte vara tomt.'); return; }
    const duplicate = this.workspace.categories.some(
      c => c.name.toLowerCase() === name.toLowerCase() && c.id !== this.editingId
    );
    if (duplicate) { this.showError('Det finns redan en punkt med det namnet.'); return; }
    const updated = this.workspace.categories.map(c =>
      c.id === this.editingId ? { ...c, name } : c
    );
    this.workspaceService.updateCategories(this.workspaceId, updated);
    this.editingId = null;
  }

  cancelEdit(): void { this.editingId = null; }

  addCategory(): void {
    if (!this.workspace) return;
    const name = this.newCategoryName.trim();
    if (!name) return;
    const duplicate = this.workspace.categories.some(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) { this.showError('Det finns redan en punkt med det namnet.'); return; }
    const newCategory: Category = { id: crypto.randomUUID(), name, count: 0 };
    this.workspaceService.updateCategories(this.workspaceId, [...this.workspace.categories, newCategory]);
    this.newCategoryName = '';
  }

  confirmDeleteCategory(category: Category): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Ta bort punkt', message: `Vill du ta bort "${category.name}"?` }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed && this.workspace) {
        const updated = this.workspace.categories.filter(c => c.id !== category.id);
        this.workspaceService.updateCategories(this.workspaceId, updated);
      }
    });
  }

  async inviteMember(): Promise<void> {
    if (!this.inviteEmail.trim() || !this.workspace) return;
    this.inviting = true;
    try {
      const inviterEmail = this.workspace.memberEmails[this.currentUserId] ?? this.currentUserId;
      await this.workspaceService.shareWithEmail(
        this.workspaceId,
        this.inviteEmail,
        this.workspace.title,
        inviterEmail
      );
      this.inviteEmail = '';
      this.snackbar.open('Inbjudan skickad!', 'Stäng', { duration: 3000 });
    } catch (e: any) {
      this.showError(e.message);
    } finally {
      this.inviting = false;
    }
  }

  confirmRemoveMember(uid: string): void {
    if (!this.workspace) return;
    const email = this.workspace.memberEmails[uid] ?? uid;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Ta bort medlem', message: `Ta bort ${email} från den här listan?` }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed && this.workspace) {
        this.workspaceService.removeMember(
          this.workspaceId, uid, this.workspace.members, this.workspace.memberEmails
        );
      }
    });
  }

  confirmArchiveWorkspace(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Arkivera',
        message: `Vill du arkivera "${this.workspace?.title}"? Den döljs men kan återställas.`
      }
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.workspaceService.archiveWorkspace(this.workspaceId);
        this.router.navigate(['/']);
      }
    });
  }

  async unarchiveWorkspace(): Promise<void> {
    await this.workspaceService.restoreWorkspace(this.workspaceId);
  }

  confirmDeleteWorkspace(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Radera permanent', message: 'Är du säker? Denna åtgärd kan inte ångras.' }
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.workspaceService.deleteWorkspace(this.workspaceId);
        this.router.navigate(['/']);
      }
    });
  }

  dropCategory(event: CdkDragDrop<Category[]>): void {
    if (!this.workspace || event.previousIndex === event.currentIndex) return;
    const reordered = [...this.workspace.categories];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.workspaceService.updateCategories(this.workspaceId, reordered);
  }

  toggleAdmin(uid: string): void {
    if (!this.workspace) return;
    const isCurrentlyAdmin = this.workspace.admins?.includes(uid) ?? false;
    this.workspaceService.setAdmin(this.workspaceId, uid, !isCurrentlyAdmin);
  }

  toggleSetting(key: 'enableComments' | 'enableHistory', value: boolean): void {
    if (!this.workspace) return;
    let enableComments = key === 'enableComments' ? value : (this.workspace.enableComments ?? false);
    const enableHistory  = key === 'enableHistory'  ? value : (this.workspace.enableHistory  ?? false);
    // Comments require history — turn off comments when history is disabled
    if (!enableHistory) enableComments = false;
    this.workspaceService.updateSettings(this.workspaceId, enableComments, enableHistory);
  }

  private showError(message: string): void {
    this.snackbar.open(message, 'Stäng', { duration: 3500 });
  }
}
