import { Component, ViewChild, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { CounterStateService } from '../../services/counter-state.service';
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
  private readonly stateService = inject(CounterStateService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  @ViewChild(ChartComponent) private chartComponent?: ChartComponent;

  readonly data$ = this.stateService.data$;

  increment(id: string): void {
    this.stateService.increment(id);
  }

  decrement(id: string): void {
    this.stateService.decrement(id);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  confirmReset(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Nollställ', message: 'Vill du nollställa alla räknare?' }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.stateService.reset();
    });
  }

  async exportShare(): Promise<void> {
    if (!this.chartComponent) return;

    const data = await firstValueFrom(this.data$);
    const chartCanvas = this.chartComponent.getCanvas();

    // Composite canvas: white background + chart image with padding
    const padding = 20;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartCanvas.width + padding * 2;
    exportCanvas.height = chartCanvas.height + padding * 2;

    const ctx = exportCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(chartCanvas, padding, padding);

    const blob = await new Promise<Blob>((resolve, reject) =>
      exportCanvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Export misslyckades')),
        'image/png'
      )
    );

    const filename = `${data.title}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    // Use Web Share API when supported (iOS 15+, Chrome Android)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: data.title });
        return;
      } catch {
        // User cancelled share — fall through to download
      }
    }

    // Fallback: trigger a file download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
