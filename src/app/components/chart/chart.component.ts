import {
  Component, ElementRef, Input, OnChanges,
  OnDestroy, OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import {
  Chart, BarController, BarElement,
  CategoryScale, LinearScale, Title, Tooltip
} from 'chart.js';
import { Workspace } from '../../models/counter.model';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip);

/** Generate visually distinct colors using the golden angle. */
function categoryColor(index: number): string {
  return `hsl(${(index * 137.5) % 360}, 60%, 55%)`;
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

@Component({
  selector: 'app-chart',
  template: `
    <div class="chart-wrapper" [style.height.px]="chartHeight">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrapper { position: relative; width: 100%; }
    canvas { display: block; background: var(--surface); border-radius: 4px; }
  `]
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) data!: Workspace;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private darkMql = window.matchMedia('(prefers-color-scheme: dark)');
  private darkMqlListener = () => { if (this.chart) this.refreshChart(); };

  get chartHeight(): number {
    const BAR_HEIGHT = 36;
    const OVERHEAD = 80;
    return Math.max(200, this.data.categories.length * BAR_HEIGHT + OVERHEAD);
  }

  ngOnInit(): void {
    this.createChart();
    this.darkMql.addEventListener('change', this.darkMqlListener);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart) this.refreshChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.darkMql.removeEventListener('change', this.darkMqlListener);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private get isCheckbox(): boolean {
    return (this.data.mode ?? 'counter') === 'checkbox';
  }

  private createChart(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.buildData(),
      options: this.buildOptions()
    });
  }

  private refreshChart(): void {
    if (!this.chart) return;
    this.chart.data = this.buildData();
    (this.chart.options as any) = this.buildOptions();
    this.chart.update();
  }

  private truncateLabel(name: string, max = 18): string {
    return name.length > max ? name.slice(0, max - 1) + '…' : name;
  }

  private buildData() {
    const dark = prefersDark();
    const labels = this.data.categories.map(c => this.truncateLabel(c.name));

    if (this.isCheckbox) {
      return {
        labels,
        datasets: [{
          data: this.data.categories.map(() => 1),
          backgroundColor: this.data.categories.map(c =>
            c.checked ? '#4caf50' : (dark ? '#424242' : '#e0e0e0')
          ),
          borderColor: this.data.categories.map(c =>
            c.checked ? '#388e3c' : (dark ? '#616161' : '#bdbdbd')
          ),
          borderWidth: 1,
          borderRadius: 4
        }]
      };
    }

    const colors = this.data.categories.map((_, i) => categoryColor(i));
    return {
      labels,
      datasets: [{
        data: this.data.categories.map(c => c.count),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('55%', '40%')),
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }

  private buildOptions() {
    const dark = prefersDark();
    const textColor = dark ? '#e0e0e0' : '#212121';
    const gridColor = dark ? '#333333' : '#e0e0e0';
    const tickColor = dark ? '#9e9e9e' : '#757575';

    if (this.isCheckbox) {
      const checked = this.data.categories.filter(c => c.checked).length;
      const total = this.data.categories.length;
      return {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: {
            display: true,
            text: [this.data.title, `${checked} av ${total} klara`],
            color: textColor,
            font: { size: 16, weight: 'bold' as const },
            padding: { bottom: 12 }
          }
        },
        scales: {
          x: { display: false, max: 1 },
          y: {
            ticks: { crossAlign: 'far' as const, color: tickColor },
            grid: { color: gridColor }
          }
        }
      };
    }

    const categories = this.data.categories;
    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: this.data.title,
          color: textColor,
          font: { size: 16, weight: 'bold' as const },
          padding: { bottom: 12 }
        },
        tooltip: {
          callbacks: {
            title: (items: any[]) => categories[items[0].dataIndex]?.name ?? ''
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0, color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: { crossAlign: 'far' as const, color: tickColor },
          grid: { color: gridColor }
        }
      }
    };
  }
}
