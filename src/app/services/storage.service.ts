import { Injectable } from '@angular/core';
import { CounterData } from '../models/counter.model';

const STORAGE_KEY = 'counter_app_data';

@Injectable({ providedIn: 'root' })
export class StorageService {

  save(data: CounterData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  load(): CounterData | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CounterData;
    } catch {
      return null;
    }
  }
}
