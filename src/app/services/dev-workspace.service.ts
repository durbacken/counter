import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Category, ChangeEvent, Workspace, WorkspaceMode } from '../models/counter.model';

const WS_KEY = 'dev_workspaces';
const CH_KEY = 'dev_changes';

type WorkspaceMap = Record<string, Workspace>;
type ChangesMap  = Record<string, ChangeEvent[]>;

/**
 * Drop-in replacement for WorkspaceService used in dev mode.
 * Persists all data to localStorage using BehaviorSubjects for reactivity.
 * No Firebase involved – works completely offline.
 */
@Injectable()
export class DevWorkspaceService {
  private readonly ws$ = new BehaviorSubject<WorkspaceMap>(this.load(WS_KEY));
  private readonly ch$ = new BehaviorSubject<ChangesMap>(this.load(CH_KEY));

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private load<T extends object>(key: string): T {
    try { return JSON.parse(localStorage.getItem(key) ?? '{}') as T; }
    catch { return {} as T; }
  }

  private saveWs(ws: WorkspaceMap): void {
    localStorage.setItem(WS_KEY, JSON.stringify(ws));
    this.ws$.next(ws);
  }

  private saveCh(ch: ChangesMap): void {
    localStorage.setItem(CH_KEY, JSON.stringify(ch));
    this.ch$.next(ch);
  }

  private patchWorkspace(id: string, patch: Partial<Workspace>): void {
    const ws = { ...this.ws$.value };
    ws[id] = { ...ws[id], ...patch };
    this.saveWs(ws);
  }

  // ─── Workspace reads ───────────────────────────────────────────────────────

  getWorkspaces(uid: string): Observable<Workspace[]> {
    return this.ws$.pipe(
      map(ws => Object.values(ws).filter(w => w.members.includes(uid)))
    );
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.ws$.pipe(map(ws => ws[id]));
  }

  // ─── Workspace writes ──────────────────────────────────────────────────────

  async createWorkspace(title: string, uid: string, email: string, mode: WorkspaceMode): Promise<string> {
    const id = crypto.randomUUID();
    const ws = { ...this.ws$.value };
    ws[id] = { id, title, ownerId: uid, members: [uid], memberEmails: { [uid]: email }, categories: [], mode };
    this.saveWs(ws);
    return id;
  }

  async updateTitle(workspaceId: string, title: string): Promise<void> {
    this.patchWorkspace(workspaceId, { title });
  }

  async updateCategories(workspaceId: string, categories: Category[]): Promise<void> {
    this.patchWorkspace(workspaceId, { categories });
  }

  async increment(workspaceId: string, categoryId: string): Promise<void> {
    const categories = this.ws$.value[workspaceId].categories.map(c =>
      c.id === categoryId ? { ...c, count: c.count + 1 } : c
    );
    this.patchWorkspace(workspaceId, { categories });
  }

  async decrement(workspaceId: string, categoryId: string): Promise<void> {
    const categories = this.ws$.value[workspaceId].categories.map(c =>
      c.id === categoryId ? { ...c, count: Math.max(0, c.count - 1) } : c
    );
    this.patchWorkspace(workspaceId, { categories });
  }

  async toggleCheck(workspaceId: string, categoryId: string): Promise<void> {
    const categories = this.ws$.value[workspaceId].categories.map(c =>
      c.id === categoryId ? { ...c, checked: !c.checked } : c
    );
    this.patchWorkspace(workspaceId, { categories });
  }

  async reset(workspaceId: string, categories: Category[]): Promise<void> {
    this.patchWorkspace(workspaceId, {
      categories: categories.map(c => ({ ...c, count: 0, checked: false }))
    });
  }

  async shareWithEmail(): Promise<void> {
    alert('E-postinbjudningar är inte tillgängliga i lokal utvecklingsläge.');
  }

  async removeMember(
    workspaceId: string, uid: string,
    currentMembers: string[], currentEmails: Record<string, string>
  ): Promise<void> {
    const members = currentMembers.filter(m => m !== uid);
    const memberEmails = { ...currentEmails };
    delete memberEmails[uid];
    this.patchWorkspace(workspaceId, { members, memberEmails });
  }

  async updateSettings(workspaceId: string, enableComments: boolean, enableHistory: boolean): Promise<void> {
    this.patchWorkspace(workspaceId, { enableComments, enableHistory });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const ws = { ...this.ws$.value };
    delete ws[workspaceId];
    this.saveWs(ws);
    const ch = { ...this.ch$.value };
    delete ch[workspaceId];
    this.saveCh(ch);
  }

  // ─── Change history ────────────────────────────────────────────────────────

  getChanges(workspaceId: string): Observable<ChangeEvent[]> {
    return this.ch$.pipe(
      map(ch =>
        (ch[workspaceId] ?? []).map(c => ({
          ...c,
          // Wrap the stored ISO string as a Firestore-Timestamp-like object
          // so ChangeHistoryComponent's getDate() works unchanged.
          timestamp: { toDate: () => new Date(c.timestamp as unknown as string) }
        }))
      )
    );
  }

  async logChange(workspaceId: string, event: Omit<ChangeEvent, 'id' | 'timestamp'>): Promise<void> {
    const ch = { ...this.ch$.value };
    const entry: ChangeEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString() as any,
    };
    ch[workspaceId] = [entry, ...(ch[workspaceId] ?? [])];
    this.saveCh(ch);
  }
}
