# Koll på läget?

A Progressive Web App (PWA) for shared real-time counting and checklists. Create a workspace, add categories, and let everyone update together from their own device. The app UI is in Swedish.

## What it does

- **Two modes**: counter (increment/decrement with +/−) or checklist (tick off items with progress %)
- Sign in with Google or magic email link — or try as a guest without signing in
- Create named workspaces, invite members by email, share a read-only public link
- Invite flow: existing users added immediately; new users get a pending invite processed on first sign-in
- Per-workspace color avatar (deterministic from ID) for quick visual identification
- Change history: every action logged with timestamp, user, and optional comment; exportable as Excel
- "Last changed by" shown under each category and on each workspace list card
- Drag-to-reorder categories directly from the main view (edit mode)
- Reset individual categories or all at once, with undo snackbar (8 s countdown)
- Duplicate a workspace (same structure, zeroed values)
- Archive workspaces instead of deleting; restore or permanently delete from the archived section
- Admin role: owner can promote members to co-admin
- Public share link: anyone with the link can view without signing in
- Workspace notes: shown on the list card and inside the view; included in exports
- Export as PNG image or Excel (.xlsx) with full change history
- Offline indicator banner when the device loses connectivity
- Skeleton loaders while Firestore data loads
- Haptic feedback on counter/checkbox interactions (Android)
- Install as a PWA on iPhone or Android — works like a native app, auto-updates in the background

---

## Tech stack

### Frontend

| What | Why |
|------|-----|
| **Angular 19** | Framework — standalone components, lazy-loaded routes |
| **Angular Material 19** | UI components (toolbar, buttons, dialogs, forms) — azure-blue theme |
| **Chart.js** | Horizontal bar chart for visualizing counts |
| **Angular Service Worker** | PWA support — offline caching, installable on mobile |

### Backend / Cloud

| What | Why |
|------|-----|
| **Firebase Auth** | Google Sign-in, magic email link, anonymous guest sign-in |
| **Cloud Firestore** | Real-time database — all changes sync instantly across devices |

### Hosting & CI/CD

| What | Why |
|------|-----|
| **GitHub** (`durbacken/counter`) | Source control |
| **Vercel** | Automatic deployment on every push to `main` |

---

## Architecture

```
src/
  app/
    components/
      login/              # Sign-in screen (Google, magic link, guest)
      workspace-list/     # Home screen — list, create, archive workspaces
      main/               # Workspace view — counter/checkbox, edit, export
      admin/              # Settings — categories, members, invite, feature flags
      chart/              # Chart.js horizontal bar chart component
      about-dialog/       # About / credits dialog
      about-page/         # Full about page (linked from dialog)
      change-history/     # Per-category change log accordion
      comment-dialog/     # Optional comment prompt after each change
      confirm-dialog/     # Reusable confirmation dialog
      share-dialog/       # Invite members + public link management
      workspace-view/     # Public read-only view (no sign-in required)
      install-banner/     # PWA install prompt (iOS instructions / Android native)
      footer/             # Shared footer component
    guards/
      auth.guard.ts       # Redirects unauthenticated users to /login
    models/
      counter.model.ts    # TypeScript interfaces: Workspace, Category, UserProfile
    services/
      auth.service.ts     # Firebase Auth — sign in, sign out, current user stream
      workspace.service.ts # Firestore CRUD — workspaces, categories, members, invite
  environments/
    environment.ts        # Firebase config (dev)
    environment.prod.ts   # Firebase config (prod) — swapped in at build time
```

### Data model (Firestore)

```
/users/{uid}
  email, displayName, photoURL

/workspaces/{workspaceId}
  title, ownerId, mode ('counter'|'checkbox')
  members: string[]               // uids
  memberEmails: { uid: email }    // cached for display
  admins?: string[]               // uids with co-admin rights
  categories: [{ id, name, count, checked? }]
  notes?: string
  archived?: boolean
  isPublic?: boolean
  enableHistory?: boolean
  enableComments?: boolean
  lastActivityAt?: Timestamp      // stamped on every logChange
  lastActivityBy?: string         // email of last actor

  /changes/{changeId}             // subcollection
    categoryId, categoryName, changeType, previousValue, newValue
    userId, userEmail, timestamp, comment?
```

Increment/decrement/toggle use **Firestore transactions** to prevent lost updates under concurrent edits.

---

## Local development

### Prerequisites

- Node.js 20+
- Access to the corporate Nexus npm registry (local `.npmrc` — not committed to git)

### Install and run

```bash
npm install
npm start
```

App runs at `http://localhost:4200`.

### Build for production

```bash
npm run build
```

Output goes to `dist/counter/browser/`.

---

## Deployment

Vercel builds and deploys automatically on every push to `main`. Live at **https://counter-durbacken.vercel.app**.

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist/counter/browser` |
| Config | `vercel.json` |

The `package-lock.json` and `.npmrc` are **not committed** — they contain corporate Nexus registry URLs.

---

## Firebase setup

### Authentication

- Provider: Google Sign-in
- Authorized domains must include the Vercel URL (`counter-durbacken.vercel.app`) — set in Firebase Console → Authentication → Settings → Authorized domains

### Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    match /workspaces/{workspaceId} {
      allow read, update: if request.auth.uid in resource.data.members;
      allow create: if request.auth.uid != null;
      allow delete: if request.auth.uid == resource.data.ownerId;
    }
  }
}
```

---

## PWA / Mobile

- **iPhone**: open in Safari → Share → "Add to Home Screen"
- **Android**: browser shows a native install prompt automatically
- The toolbar accounts for iOS safe-area insets so it is not hidden behind the status bar
- The install banner appears automatically on first visit and can be permanently dismissed

---

## Regenerating icons

Icons are already committed. To regenerate them after editing `scripts/icon.svg`:

```bash
npm run icons
```

This uses `@resvg/resvg-js` to produce all PNG sizes and `favicon.ico`. Icons are pre-committed so this only needs to be run locally when the icon changes.
