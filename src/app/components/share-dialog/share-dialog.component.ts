import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { WorkspaceService } from '../../services/workspace.service';
import { Workspace } from '../../models/counter.model';

interface ShareDialogData {
  workspace: Workspace;
  workspaceId: string;
  currentUserEmail: string;
  canManage: boolean;
}

@Component({
  selector: 'app-share-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Dela</h2>
    <mat-dialog-content>

      <!-- ─── Delad länk ─────────────────────────────── -->
      <div class="share-section">
        <p class="section-label">Delad länk</p>
        @if (data.canManage) {
          <mat-slide-toggle [checked]="isPublic" (change)="togglePublic()">
            Aktivera delningslänk
          </mat-slide-toggle>
        }
        @if (isPublic) {
          <div class="link-row">
            <span class="link-text">{{ shareUrl }}</span>
            <button mat-icon-button (click)="copyLink()" aria-label="Kopiera länk">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <p class="link-hint">
            <mat-icon class="hint-icon">info</mat-icon>
            Vem som helst med länken kan se denna {{ data.workspace.mode === 'checkbox' ? 'checklista' : 'räknare' }} utan att logga in.
          </p>
        } @else if (!data.canManage) {
          <p class="link-hint muted">Ägaren har inte aktiverat delningslänk för denna {{ data.workspace.mode === 'checkbox' ? 'checklista' : 'räknare' }}.</p>
        }
      </div>

      <mat-divider />

      <!-- ─── Inbjudningslänk ───────────────────────── -->
      @if (data.canManage) {
        <div class="share-section">
          <p class="section-label">Inbjudningslänk</p>
          @if (inviteToken) {
            <div class="link-row">
              <span class="link-text">{{ inviteLinkUrl }}</span>
              <button mat-icon-button (click)="copyInviteLink()" aria-label="Kopiera inbjudningslänk">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          }
          <div class="invite-link-actions">
            <button mat-stroked-button [disabled]="generatingToken" (click)="generateAndCopyInviteLink()">
              <mat-icon>{{ inviteToken ? 'refresh' : 'link' }}</mat-icon>
              {{ inviteToken ? 'Skapa ny länk' : 'Skapa inbjudningslänk' }}
            </button>
          </div>
          <p class="link-hint muted">
            <mat-icon class="hint-icon">group</mat-icon>
            Vem som helst med länken kan gå med som fullvärdig medlem — räkna, bocka av och se historik.
          </p>
        </div>

        <mat-divider />
      }

      <!-- ─── Bjud in ────────────────────────────────── -->
      <div class="share-section">
        <p class="section-label">Bjud in via e-post</p>
        <div class="invite-row">
          <mat-form-field appearance="outline" class="invite-field">
            <mat-label>E-postadress</mat-label>
            <input matInput [(ngModel)]="inviteEmail"
                   type="email"
                   (keydown.enter)="inviteMember()"
                   placeholder="namn&#64;exempel.se"
                   autocomplete="email" />
          </mat-form-field>
          <button mat-flat-button color="primary" class="invite-btn"
                  [disabled]="!inviteEmail.trim() || inviting"
                  (click)="inviteMember()">
            <mat-icon>person_add</mat-icon>
            Bjud in
          </button>
        </div>
        <p class="link-hint muted">
          <mat-icon class="hint-icon">email</mat-icon>
          Bjud in med e-post om du vill nå en specifik person.
        </p>
      </div>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Stäng</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .share-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }

    .section-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      margin: 0;
    }

    .link-row {
      display: flex;
      align-items: center;
      background: var(--surface-variant, #f5f5f5);
      border-radius: 8px;
      padding: 6px 4px 6px 12px;
      gap: 4px;
    }

    .link-text {
      flex: 1;
      font-size: 12px;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
      font-family: monospace;
    }

    .link-hint {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.45;

      &.muted { color: var(--text-secondary); }
    }

    .hint-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 1px;
      color: #1976d2;
    }

    .invite-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .invite-field { flex: 1; }

    .invite-btn {
      height: 56px;
      flex-shrink: 0;
    }

    .invite-link-actions {
      display: flex;
      gap: 8px;
    }
  `]
})
export class ShareDialogComponent {
  readonly data = inject<ShareDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ShareDialogComponent>);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  isPublic = this.data.workspace.isPublic ?? false;
  inviteToken = this.data.workspace.inviteToken ?? '';
  generatingToken = false;
  inviteEmail = '';
  inviting = false;

  get shareUrl(): string {
    return `${window.location.origin}/view/${this.data.workspaceId}`;
  }

  get inviteLinkUrl(): string {
    return `${window.location.origin}/join/${this.data.workspaceId}/${this.inviteToken}`;
  }

  togglePublic(): void {
    this.isPublic = !this.isPublic;
    this.workspaceService.setPublic(this.data.workspaceId, this.isPublic);
  }

  copyLink(): void {
    this.clipboard.copy(this.shareUrl);
    this.snackBar.open('Länk kopierad!', undefined, { duration: 2500 });
  }

  async generateAndCopyInviteLink(): Promise<void> {
    this.generatingToken = true;
    try {
      this.inviteToken = await this.workspaceService.generateInviteToken(this.data.workspaceId);
      this.clipboard.copy(this.inviteLinkUrl);
      this.snackBar.open('Inbjudningslänk kopierad!', undefined, { duration: 2500 });
    } finally {
      this.generatingToken = false;
    }
  }

  copyInviteLink(): void {
    this.clipboard.copy(this.inviteLinkUrl);
    this.snackBar.open('Inbjudningslänk kopierad!', undefined, { duration: 2500 });
  }

  async inviteMember(): Promise<void> {
    const email = this.inviteEmail.trim();
    if (!email) return;
    this.inviting = true;
    try {
      await this.workspaceService.shareWithEmail(
        this.data.workspaceId,
        email,
        this.data.workspace.title,
        this.data.currentUserEmail
      );
      this.inviteEmail = '';
      this.snackBar.open('Inbjudan skickad!', 'Stäng', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open(e.message ?? 'Något gick fel', 'Stäng', { duration: 3500 });
    } finally {
      this.inviting = false;
    }
  }
}
