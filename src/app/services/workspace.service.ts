import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc,
  docData, collectionData, query, where, getDocs,
  runTransaction, arrayUnion, arrayRemove, serverTimestamp, orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
// emailjs is dynamically imported in shareWithEmail to keep it out of the initial bundle
import { environment } from '../../environments/environment';
import { Category, ChangeEvent, Workspace, WorkspaceMode } from '../models/counter.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly firestore = inject(Firestore);

  getWorkspaces(uid: string): Observable<Workspace[]> {
    const q = query(
      collection(this.firestore, 'workspaces'),
      where('members', 'array-contains', uid)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Workspace[]>;
  }

  getWorkspace(id: string): Observable<Workspace> {
    return docData(
      doc(this.firestore, 'workspaces', id),
      { idField: 'id' }
    ) as Observable<Workspace>;
  }

  async createWorkspace(title: string, uid: string, email: string, mode: WorkspaceMode, notes?: string): Promise<string> {
    const data: Record<string, unknown> = {
      title,
      ownerId: uid,
      members: [uid],
      memberEmails: { [uid]: email },
      categories: [],
      mode
    };
    if (notes) data['notes'] = notes;
    const ref = await addDoc(collection(this.firestore, 'workspaces'), data);
    return ref.id;
  }

  async updateTitle(workspaceId: string, title: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { title });
  }

  async updateCategories(workspaceId: string, categories: Category[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { categories });
  }

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

  async toggleCheck(workspaceId: string, categoryId: string): Promise<void> {
    const ref = doc(this.firestore, 'workspaces', workspaceId);
    await runTransaction(this.firestore, async tx => {
      const snap = await tx.get(ref);
      const categories = (snap.data()!['categories'] as Category[]).map(c =>
        c.id === categoryId ? { ...c, checked: !c.checked } : c
      );
      tx.update(ref, { categories });
    });
  }

  async reset(workspaceId: string, categories: Category[]): Promise<void> {
    const cleared = categories.map(c => ({ ...c, count: 0, checked: false }));
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { categories: cleared });
  }

  /**
   * Invite a user by email. If they already have an account they are added
   * immediately. If not, a pending invite is stored and processed when they
   * sign in for the first time. An email is sent in both cases.
   */
  async shareWithEmail(
    workspaceId: string,
    email: string,
    workspaceTitle: string,
    inviterEmail: string
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const userSnap = await getDocs(query(
      collection(this.firestore, 'users'),
      where('email', '==', normalizedEmail)
    ));

    if (!userSnap.empty) {
      const uid = userSnap.docs[0].id;
      await updateDoc(doc(this.firestore, 'workspaces', workspaceId), {
        members: arrayUnion(uid),
        [`memberEmails.${uid}`]: normalizedEmail
      });
    } else {
      // Check for an existing pending invite to avoid duplicates
      const existingSnap = await getDocs(query(
        collection(this.firestore, 'invites'),
        where('email', '==', normalizedEmail),
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'pending')
      ));
      if (!existingSnap.empty) {
        throw new Error('En inbjudan har redan skickats till denna e-postadress.');
      }
      await addDoc(collection(this.firestore, 'invites'), {
        email: normalizedEmail,
        workspaceId,
        workspaceTitle,
        invitedByEmail: inviterEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    }

    const { default: emailjs } = await import('@emailjs/browser');
    await emailjs.send(
      environment.emailjs.serviceId,
      environment.emailjs.templateId,
      {
        to_email: normalizedEmail,
        workspace_name: workspaceTitle,
        from_name: inviterEmail,
        app_link: environment.appUrl
      },
      environment.emailjs.publicKey
    );
  }

  async removeMember(
    workspaceId: string,
    uid: string,
    currentMembers: string[],
    currentEmails: { [uid: string]: string }
  ): Promise<void> {
    const members = currentMembers.filter(m => m !== uid);
    const memberEmails = { ...currentEmails };
    delete memberEmails[uid];
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { members, memberEmails });
  }

  async setAdmin(workspaceId: string, uid: string, isAdmin: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), {
      admins: isAdmin ? arrayUnion(uid) : arrayRemove(uid)
    });
  }

  async updateSettings(workspaceId: string, enableComments: boolean, enableHistory: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { enableComments, enableHistory });
  }

  async updateNotes(workspaceId: string, notes: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { notes });
  }

  async archiveWorkspace(workspaceId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { archived: true });
  }

  async restoreWorkspace(workspaceId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { archived: false });
  }

  async setPublic(workspaceId: string, isPublic: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, 'workspaces', workspaceId), { isPublic });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'workspaces', workspaceId));
  }

  getChanges(workspaceId: string): Observable<ChangeEvent[]> {
    const q = query(
      collection(this.firestore, 'workspaces', workspaceId, 'changes'),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<ChangeEvent[]>;
  }

  async logChange(workspaceId: string, event: Omit<ChangeEvent, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(
      collection(this.firestore, 'workspaces', workspaceId, 'changes'),
      { ...event, timestamp: serverTimestamp() }
    );
  }
}
