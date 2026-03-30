import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CounterData, Category } from '../models/counter.model';
import { StorageService } from './storage.service';

const DEFAULT_DATA: CounterData = {
  title: 'Min Räknare',
  categories: []
};

@Injectable({ providedIn: 'root' })
export class CounterStateService {
  private readonly storage = inject(StorageService);

  private readonly _data$ = new BehaviorSubject<CounterData>(
    this.storage.load() ?? { ...DEFAULT_DATA }
  );

  /** Observable stream of the full counter data. */
  readonly data$ = this._data$.asObservable();

  private commit(updater: (current: CounterData) => CounterData): void {
    const next = updater(this._data$.value);
    this._data$.next(next);
    this.storage.save(next);
  }

  updateTitle(title: string): void {
    this.commit(d => ({ ...d, title }));
  }

  addCategory(name: string): void {
    const category: Category = { id: crypto.randomUUID(), name, count: 0 };
    this.commit(d => ({ ...d, categories: [...d.categories, category] }));
  }

  updateCategoryName(id: string, name: string): void {
    this.commit(d => ({
      ...d,
      categories: d.categories.map(c => c.id === id ? { ...c, name } : c)
    }));
  }

  deleteCategory(id: string): void {
    this.commit(d => ({
      ...d,
      categories: d.categories.filter(c => c.id !== id)
    }));
  }

  increment(id: string): void {
    this.commit(d => ({
      ...d,
      categories: d.categories.map(c => c.id === id ? { ...c, count: c.count + 1 } : c)
    }));
  }

  decrement(id: string): void {
    this.commit(d => ({
      ...d,
      categories: d.categories.map(c =>
        c.id === id ? { ...c, count: Math.max(0, c.count - 1) } : c
      )
    }));
  }

  reset(): void {
    this.commit(d => ({
      ...d,
      categories: d.categories.map(c => ({ ...c, count: 0 }))
    }));
  }
}
