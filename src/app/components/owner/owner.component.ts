import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { Workspace } from '../../models/counter.model';

const ADMIN_EMAILS = [
  'tobias.sjobeck@gmail.com',
  'tobias.sjobeck@4cstrategies.com',
];

interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
}

interface WorkspaceSummary {
  id: string;
  title: string;
  mode: 'counter' | 'checkbox';
  categories: number;
  isOwner: boolean;
  lastActivityAt: Date | null;
}

interface UserStats extends UserProfile {
  totalWorkspaces: number;
  ownerOf: number;
  memberOf: number;
  lastActivityAt: Date | null;
  lastActivityWorkspace: string | null;
  workspaces: WorkspaceSummary[];
}

@Component({
  selector: 'app-owner',
  imports: [DatePipe, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './owner.component.html',
  styleUrl: './owner.component.scss',
})
export class OwnerComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  loading = true;
  stats: UserStats[] = [];
  totalWorkspaces = 0;
  refreshedAt: Date | null = null;
  expandedUids = new Set<string>();

  toggleExpand(uid: string): void {
    if (this.expandedUids.has(uid)) {
      this.expandedUids.delete(uid);
    } else {
      this.expandedUids.add(uid);
    }
  }

  async ngOnInit(): Promise<void> {
    const user = await new Promise<any>(resolve => {
      this.auth.user$.pipe().subscribe(u => resolve(u));
    });
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      this.router.navigate(['/']);
      return;
    }
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const [usersSnap, workspacesSnap] = await Promise.all([
        getDocs(collection(this.firestore, 'users')),
        getDocs(collection(this.firestore, 'workspaces')),
      ]);

      const users: UserProfile[] = usersSnap.docs.map(d => ({
        uid: d.id,
        email: d.data()['email'] ?? '',
        displayName: d.data()['displayName'] ?? null,
      }));

      const workspaces = workspacesSnap.docs.map(d => ({
        ...(d.data() as Workspace),
        id: d.id,
      }));

      // Fetch changes for each workspace in parallel, build email -> most recent activity map
      const lastActivityByEmail = new Map<string, { at: Date; workspaceId: string }>();
      const allChangeSnaps = await Promise.all(
        workspaces.map(ws =>
          getDocs(collection(this.firestore, 'workspaces', ws.id, 'changes')).catch(() => null)
        )
      );
      allChangeSnaps.forEach((snap, i) => {
        if (!snap) return;
        const workspaceId = workspaces[i].id;
        for (const d of snap.docs) {
          const data = d.data();
          const email: string = data['userEmail'] ?? '';
          if (!email) continue;
          const ts = data['timestamp'];
          const at: Date = ts?.toDate?.() ?? new Date(ts);
          const existing = lastActivityByEmail.get(email);
          if (!existing || at.getTime() > existing.at.getTime()) {
            lastActivityByEmail.set(email, { at, workspaceId });
          }
        }
      });

      // Build workspaceId -> title lookup
      const wsTitle = new Map(workspaces.map(ws => [ws.id, ws.title]));

      this.totalWorkspaces = workspaces.length;

      this.stats = users.map(user => {
        const mine = workspaces.filter(ws => ws.members?.includes(user.uid));
        const ownerOf = mine.filter(ws => ws.ownerId === user.uid).length;

        const activity = lastActivityByEmail.get(user.email) ?? null;
        const lastActivityAt = activity?.at ?? null;
        const lastActivityWorkspace = activity ? (wsTitle.get(activity.workspaceId) ?? null) : null;

        const workspaceSummaries: WorkspaceSummary[] = mine
          .map(ws => ({
            id: ws.id,
            title: ws.title,
            mode: (ws.mode ?? 'counter') as 'counter' | 'checkbox',
            categories: ws.categories?.length ?? 0,
            isOwner: ws.ownerId === user.uid,
            lastActivityAt: ws.lastActivityAt
              ? (ws.lastActivityAt?.toDate?.() ?? new Date(ws.lastActivityAt))
              : null,
          }))
          .sort((a, b) => {
            if (!a.lastActivityAt) return 1;
            if (!b.lastActivityAt) return -1;
            return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
          });

        return {
          ...user,
          totalWorkspaces: mine.length,
          ownerOf,
          memberOf: mine.length - ownerOf,
          lastActivityAt,
          lastActivityWorkspace,
          workspaces: workspaceSummaries,
        };
      }).sort((a, b) => {
        if (!a.lastActivityAt) return 1;
        if (!b.lastActivityAt) return -1;
        return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
      });

      this.refreshedAt = new Date();
    } finally {
      this.loading = false;
    }
  }

  timeAgo(date: Date | null): string {
    if (!date) return 'Aldrig';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just nu';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min sedan`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h sedan`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'igår';
    return `${days} dagar sedan`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
