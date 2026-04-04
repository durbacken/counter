import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Dela</h2>
    <mat-dialog-content>

      <!-- ─── Bjud in med länk ─────────────────────── -->
      @if (data.canManage) {
        <div class="section">
          <p class="section-label">Bjud in med länk</p>
          <button mat-flat-button color="primary" class="share-invite-btn"
                  [disabled]="generatingToken" (click)="generateAndShareInviteLink()">
            <mat-icon>share</mat-icon>
            Dela inbjudningslänk
          </button>
          <p class="link-hint muted">
            <mat-icon class="hint-icon">group</mat-icon>
            Öppnar delningsmenyn — skicka via SMS, Mail, WhatsApp eller annat.
          </p>
        </div>

        <div class="divider"><span>eller bjud in direkt via e-post</span></div>
      }

      <!-- ─── Bjud in via e-post ────────────────────── -->
      <div class="section">
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
      </div>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Stäng</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 0;
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

    .share-invite-btn { width: 100%; }

    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      color: var(--text-secondary);
      font-size: 12px;

      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--divider); }
    }
  `]
})
export class ShareDialogComponent {
  readonly data = inject<ShareDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ShareDialogComponent>);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  inviteToken = this.data.workspace.inviteToken ?? '';
  generatingToken = false;
  inviteEmail = '';
  inviting = false;

  get inviteLinkUrl(): string {
    return `${window.location.origin}/join/${this.data.workspaceId}/${this.inviteToken}`;
  }

  async generateAndShareInviteLink(): Promise<void> {
    this.generatingToken = true;
    try {
      if (!this.inviteToken) {
        this.inviteToken = await this.workspaceService.generateInviteToken(this.data.workspaceId);
      }
      await this.shareInviteLink();
    } finally {
      this.generatingToken = false;
    }
  }

  async shareInviteLink(): Promise<void> {
    const url = this.inviteLinkUrl;
    if (navigator.share) {
      await navigator.share({
        title: this.data.workspace.title,
        text: `Gå med i "${this.data.workspace.title}" på Koll på läget?`,
        url,
      }).catch(() => {});
    } else {
      this.clipboard.copy(url);
      this.snackBar.open('Inbjudningslänk kopierad!', undefined, { duration: 2500 });
    }
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
