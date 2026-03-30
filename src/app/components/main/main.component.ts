import { Component, ViewChild, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, switchMap } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { WorkspaceService } from '../../services/workspace.service';
import { ChartComponent } from '../chart/chart.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-main',
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    ChartComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(ChartComponent) private chartComponent?: ChartComponent;

  readonly workspace$ = this.route.paramMap.pipe(
    switchMap(params => this.workspaceService.getWorkspace(params.get('id')!))
  );

  private get workspaceId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  increment(categoryId: string): void {
    this.workspaceService.increment(this.workspaceId, categoryId);
  }

  decrement(categoryId: string): void {
    this.workspaceService.decrement(this.workspaceId, categoryId);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goToAdmin(): void {
    this.router.navigate(['/workspace', this.workspaceId, 'admin']);
  }

  confirmReset(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Nollställ', message: 'Vill du nollställa alla räknare?' }
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      const workspace = await firstValueFrom(this.workspace$);
      this.workspaceService.reset(this.workspaceId, workspace.categories);
    });
  }

  async exportShare(): Promise<void> {
    if (!this.chartComponent) return;
    const workspace = await firstValueFrom(this.workspace$);
    const chartCanvas = this.chartComponent.getCanvas();

    const padding = 20;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartCanvas.width + padding * 2;
    exportCanvas.height = chartCanvas.height + padding * 2;

    const ctx = exportCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(chartCanvas, padding, padding);

    const blob = await new Promise<Blob>((resolve, reject) =>
      exportCanvas.toBlob(b => b ? resolve(b) : reject(new Error('Export misslyckades')), 'image/png')
    );

    const filename = `${workspace.title}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: workspace.title }); return; } catch { }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
