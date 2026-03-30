export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Workspace {
  id: string;
  title: string;
  ownerId: string;
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
