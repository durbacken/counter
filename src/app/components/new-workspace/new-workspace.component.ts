import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { WorkspaceMode } from '../../models/counter.model';

@Component({
  selector: 'app-new-workspace',
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './new-workspace.component.html',
  styleUrl: './new-workspace.component.scss'
})
export class NewWorkspaceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly auth = inject(AuthService);

  readonly mode: WorkspaceMode =
    (this.route.snapshot.paramMap.get('mode') as WorkspaceMode) ?? 'counter';

  title = this.mode === 'counter' ? 'Min räknare' : 'Min checklista';
  creating = false;

  get isCounter(): boolean { return this.mode === 'counter'; }

  goBack(): void { this.router.navigate(['/']); }

  async create(): Promise<void> {
    const t = this.title.trim();
    if (!t || this.creating) return;
    this.creating = true;
    try {
      const user = await firstValueFrom(this.auth.user$.pipe(filter(u => !!u)));
      const id = await this.workspaceService.createWorkspace(t, user!.uid, user!.email!, this.mode);
      this.router.navigate(['/workspace', id]);
    } finally {
      this.creating = false;
    }
  }
}
