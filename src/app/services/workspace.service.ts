import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc,
  docData, collectionData, query, where, getDocs,
  runTransaction, arrayUnion
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Category, Workspace } from '../models/counter.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly firestore = inject(Firestore);

  /** All workspaces the current user is a member of, live. */
  getWorkspaces(uid: string): Observable<Workspace[]> {
    const q = query(
      collection(this.firestore, 'workspaces'),
      where('members', 'array-contains', uid)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Workspace[]>;
  }

  /** A single workspace, live. */
  getWorkspace(id: string): Observable<Workspace> {
    return docData(
      doc(this.firestore, 'workspaces', id),
      { idField: 'id' }
    ) as Observable<Workspace>;
  }

  async createWorkspace(title: string, uid: string, email: string): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'workspaces'), {
      title,
      ownerId: uid,
      members: [uid],
      memberEmails: { [uid]: email },
      categories: []
    });
    return ref.id;
  }

  async updateTitle(workspaceId: string, title: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { title });
  }

  async addCategory(workspaceId: string, categories: Category[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { categories });
  }

  async updateCategories(workspaceId: string, categories: Category[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { categories });
  }

  /** Uses a transaction so concurrent increments from multiple users are safe. */
  async increment(workspaceId: string, categoryId: string): Promise<void> {
    const ref = doc(this.firestore, 'workspaces', workspaceId);
    await runTransaction(this.firestore, async tx => {
      const snap = await tx.get(ref);
      const categories = (snap.data()!['categories'] as Category[]).map(c =>
        c.id === categoryId ? { ...c, count: c.count + 1 } : c
      );
      tx.update(ref, { categories });
    });
  }

  async decrement(workspaceId: string, categoryId: string): Promise<void> {
    const ref = doc(this.firestore, 'workspaces', workspaceId);
    await runTransaction(this.firestore, async tx => {
      const snap = await tx.get(ref);
      const categories = (snap.data()!['categories'] as Category[]).map(c =>
        c.id === categoryId ? { ...c, count: Math.max(0, c.count - 1) } : c
      );
      tx.update(ref, { categories });
    });
  }

  async reset(workspaceId: string, categories: Category[]): Promise<void> {
    const zeroed = categories.map(c => ({ ...c, count: 0 }));
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { categories: zeroed });
  }

  /**
   * Share this workspace with a user by email.
   * The user must have signed in at least once so their profile exists.
   */
  async shareWithEmail(workspaceId: string, email: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'users'),
      where('email', '==', email.trim().toLowerCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('Ingen användare hittades med den e-postadressen. Personen måste ha loggat in minst en gång.');
    }
    const uid = snap.docs[0].id;
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), {
      members: arrayUnion(uid),
      [`memberEmails.${uid}`]: email.trim().toLowerCase()
    });
  }

  async removeMember(workspaceId: string, uid: string, currentMembers: string[], currentEmails: { [uid: string]: string }): Promise<void> {
    const members = currentMembers.filter(m => m !== uid);
    const memberEmails = { ...currentEmails };
    delete memberEmails[uid];
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { members, memberEmails });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'workspaces', workspaceId));
  }
}
