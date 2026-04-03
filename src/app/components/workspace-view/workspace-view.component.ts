import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WorkspaceService } from '../../services/workspace.service';
import { Category, Workspace } from '../../models/counter.model';

interface ViewState {
  workspace: Workspace | null;
}

@Component({
  selector: 'app-workspace-view',
  imports: [AsyncPipe, MatIconModule, MatDividerModule, MatCheckboxModule, MatProgressBarModule],
  template: `
    @if (state$ | async; as state) {
      @if (state.workspace; as ws) {
        <div class="view-page">
          <div class="view-header">
            <img src="icons/icon-192x192.png" class="header-logo" alt="" />
            <h1 class="view-title">{{ ws.title }}</h1>
            @if (ws.notes) {
              <p class="view-notes">{{ ws.notes }}</p>
            }
          </div>

          <div class="view-content">
            @if (ws.categories.length === 0) {
              <p class="empty">Inga punkter.</p>
            }

            @if ((ws.mode ?? 'counter') === 'counter') {
              <div class="category-list">
                @for (cat of ws.categories; track cat.id; let last = $last) {
                  <div class="category-row">
                    <span class="cat-name">{{ cat.name }}</span>
                    <span class="cat-count">{{ cat.count }}</span>
                  </div>
                  @if (!last) { <mat-divider /> }
                }
              </div>
            } @else {
              <div class="category-list">
                @for (cat of ws.categories; track cat.id; let last = $last) {
                  <div class="category-row checkbox-row">
                    <mat-checkbox [checked]="cat.checked ?? false" [disabled]="true" class="cat-checkbox">
                      {{ cat.name }}
                    </mat-checkbox>
                  </div>
                  @if (!last) { <mat-divider /> }
                }
              </div>
              <div class="progress-summary">
                <div class="progress-label">
                  <span>{{ checkedCount(ws.categories) }} av {{ ws.categories.length }} klara</span>
                  <span class="progress-pct">{{ progressPct(ws.categories) }}%</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="progressPct(ws.categories)" />
              </div>
            }
          </div>

          <p class="view-footer">
            <img src="icons/icon-192x192.png" class="footer-logo" alt="" />
            Koll på läget? &nbsp;·&nbsp; Skrivskyddat
          </p>
        </div>
      } @else {
        <div class="error-page">
          <mat-icon class="error-icon">lock</mat-icon>
          <p>Den här länken finns inte eller är inte tillgänglig för delning.</p>
        </div>
      }
    }
  `,
  styles: [`
    .view-page {
      min-height: 100dvh;
      background: var(--app-bg);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .view-header {
      text-align: center;
      padding: 32px 24px 16px;
      width: 100%;
      max-width: 600px;
    }

    .header-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .view-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 8px;
      color: var(--text-primary);
    }

    .view-notes {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    .view-content {
      width: 100%;
      max-width: 600px;
      padding: 0 16px;
      flex: 1;
    }

    .category-list {
      background: var(--surface);
      border-radius: 12px;
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 16px;
    }

    .category-row {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      min-height: 56px;

      &.checkbox-row { padding: 12px 16px; }
    }

    .cat-name {
      flex: 1;
      font-size: 16px;
      color: var(--text-primary);
    }

    .cat-count {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      min-width: 40px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .cat-checkbox { flex: 1; font-size: 16px; }

    .progress-summary {
      background: var(--surface);
      border-radius: 12px;
      box-shadow: var(--shadow);
      padding: 16px;
      margin-bottom: 16px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .progress-pct { font-weight: 600; color: #1976d2; }

    .empty { color: var(--text-secondary); text-align: center; padding: 32px 0; }

    .view-footer {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
      padding: 16px;
      margin-top: auto;
    }

    .footer-logo {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      filter: grayscale(1);
      opacity: 0.5;
    }

    .error-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: var(--text-secondary);
      padding: 24px;
      text-align: center;
    }

    .error-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.4; }
  `]
})
export class WorkspaceViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceService = inject(WorkspaceService);

  readonly state$ = this.route.paramMap.pipe(
    switchMap(params =>
      this.workspaceService.getWorkspace(params.get('id')!).pipe(
        map(ws => ({ workspace: ws })),
        catchError(() => of({ workspace: null }))
      )
    )
  );

  checkedCount(categories: Category[]): number {
    return categories.filter(c => c.checked).length;
  }

  progressPct(categories: Category[]): number {
    if (!categories.length) return 0;
    return Math.round(this.checkedCount(categories) / categories.length * 100);
  }
}
