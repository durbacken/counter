import {
  Component, ElementRef, Input, OnChanges,
  OnDestroy, OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import {
  Chart, BarController, BarElement,
  CategoryScale, LinearScale, Title, Tooltip
} from 'chart.js';
import { CounterData } from '../../models/counter.model';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip);

/** Generate visually distinct colors using the golden angle. */
function categoryColor(index: number): string {
  return `hsl(${(index * 137.5) % 360}, 60%, 55%)`;
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
    canvas { display: block; }
  `]
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) data!: CounterData;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  /** Grows with the number of categories so bars never squish together. */
  get chartHeight(): number {
    const BAR_HEIGHT = 36;
    const OVERHEAD = 80; // title + x-axis
    return Math.max(200, this.data.categories.length * BAR_HEIGHT + OVERHEAD);
  }

  ngOnInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart) {
      this.refreshChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /** Exposes the canvas for image export in the parent component. */
  getCanvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private createChart(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.buildData(),
      options: {
        indexAxis: 'y' as const,  // horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: this.data.title,
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 12 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 }
          },
          y: {
            ticks: { crossAlign: 'far' }
          }
        }
      }
    });
  }

  private refreshChart(): void {
    if (!this.chart) return;
    this.chart.data = this.buildData();
    // Update title text via options
    const titlePlugin = this.chart.options.plugins?.title;
    if (titlePlugin) titlePlugin.text = this.data.title;
    this.chart.update();
  }

  private buildData() {
    const colors = this.data.categories.map((_, i) => categoryColor(i));
    return {
      labels: this.data.categories.map(c => c.name),
      datasets: [{
        data: this.data.categories.map(c => c.count),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('55%', '40%')),
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }
}
