import { Component, Input, OnChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Category, ChangeEvent, ChangeType } from '../../models/counter.model';

interface CategoryHistory {
  category: Category;
  changes: ChangeEvent[];
  commentCount: number;
}

@Component({
  selector: 'app-change-history',
  imports: [DatePipe, MatExpansionModule, MatIconModule],
  templateUrl: './change-history.component.html',
  styleUrl: './change-history.component.scss'
})
export class ChangeHistoryComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() changes: ChangeEvent[] = [];
  @Input() showComments: boolean = false;

  categoryHistories: CategoryHistory[] = [];

  ngOnChanges(): void {
    this.categoryHistories = this.categories
      .map(cat => {
        const changes = this.changes.filter(c => c.categoryId === cat.id);
        return {
          category: cat,
          changes,
          commentCount: changes.filter(c => c.comment).length
        };
      })
      .filter(h => h.changes.length > 0);
  }

  describeChange(change: ChangeEvent): string {
    switch (change.changeType as ChangeType) {
      case 'increment': return `${change.previousValue} → ${change.newValue}`;
      case 'decrement': return `${change.previousValue} → ${change.newValue}`;
      case 'toggle_on':  return 'Avbockad → Ikryssad';
      case 'toggle_off': return 'Ikryssad → Avbockad';
    }
  }

  getDate(timestamp: any): Date | null {
    return timestamp?.toDate?.() ?? null;
  }
}
