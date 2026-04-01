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
  /** Show comment dialog after each change. History is always saved regardless. */
  enableComments?: boolean;
  /** Show the per-category history accordion. History is always saved regardless. */
  enableHistory?: boolean;
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
