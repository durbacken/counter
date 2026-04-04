export type WorkspaceMode = 'counter' | 'checkbox';

export interface Category {
  id: string;
  name: string;
  count: number;       // used in counter mode
  checked?: boolean;   // used in checkbox mode
}

export interface Workspace {
  id: string;
  title: string;
  ownerId: string;
  mode: WorkspaceMode; // defaults to 'counter' for existing workspaces
  /** UIDs of everyone who can access this workspace. */
  members: string[];
  /** Maps uid → email for display purposes. */
  memberEmails: { [uid: string]: string };
  categories: Category[];
  /** UIDs of members promoted to admin (co-owner). Can manage settings but not delete workspace. */
  admins?: string[];
  /** Show comment dialog after each change. History is always saved regardless. */
  enableComments?: boolean;
  /** Show the per-category history accordion. History is always saved regardless. */
  enableHistory?: boolean;
  /** Optional description / notes visible on the workspace card and view page. */
  notes?: string;
  /** Soft-deleted by owner; hidden from main list but restorable. */
  archived?: boolean;
  /** Allow anyone with the link to view this workspace without signing in. */
  isPublic?: boolean;
  /** Email of the last person who made a change (set on every logChange call). */
  lastActivityBy?: string;
  /** Timestamp of the last change (set on every logChange call). */
  lastActivityAt?: any;
  /** Token granting anyone with the link full membership. */
  inviteToken?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export type ChangeType = 'increment' | 'decrement' | 'toggle_on' | 'toggle_off';

export interface ChangeEvent {
  id: string;
  workspaceId: string;
  categoryId: string;
  categoryName: string;
  changeType: ChangeType;
  previousValue: number | boolean;
  newValue: number | boolean;
  userId: string;
  userEmail: string;
  timestamp: any; // Firestore Timestamp
  comment?: string;
}
