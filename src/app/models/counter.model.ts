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
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}
