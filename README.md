# Counter

A Progressive Web App (PWA) for shared real-time counting across multiple people. Built for family use — create a workspace, add categories, and let everyone count together from their own device.

The app UI is in Swedish.

## What it does

- Sign in with Google
- Create named **workspaces** (e.g. "Family Counter")
- Add **categories** to count (e.g. "Red cars", "Blue birds")
- Increment or decrement each category — updates instantly for everyone sharing the workspace
- Invite family members by email to join a workspace
- View a horizontal bar chart of all counts
- Export/share the chart as a PNG image
- Install as a PWA on iPhone or Android (works like a native app)

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
| **Firebase Auth** | Google Sign-in — no passwords to manage |
| **Cloud Firestore** | Real-time database — all count changes sync instantly across devices |

### Hosting & CI/CD

| What | Why |
|------|-----|
| **GitHub** (`durbacken/counter`) | Source control |
| **Netlify** | Automatic deployment on every push to `main` |

---

## Architecture

```
src/
  app/
    components/
      login/              # Google Sign-in screen
      workspace-list/     # Home screen — list and create workspaces
      main/               # Counter screen — increment/decrement/chart/export
      admin/              # Settings — categories, members, invite, delete workspace
      chart/              # Chart.js horizontal bar chart component
      install-banner/     # PWA install prompt (iOS instructions / Android native)
      confirm-dialog/     # Reusable confirmation dialog
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
  email: string
  displayName: string
  photoURL: string

/workspaces/{workspaceId}
  title: string
  ownerId: string
  members: string[]             // list of uids
  memberEmails: { uid: email }  // cached for display
  categories: [
    { id: string, name: string, count: number }
  ]
```

Increment and decrement use **Firestore transactions** to prevent lost updates when multiple people count at the same time.

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

Netlify builds and deploys automatically on every push to `main`.

| Setting | Value |
|---------|-------|
| Build command | `npm install --include=dev && npm run build` |
| Publish directory | `dist/counter/browser` |
| Node version | 20 |

The `package-lock.json` and `.npmrc` are **not committed** — they contain corporate Nexus registry URLs that would cause Netlify's npm to time out.

---

## Firebase setup

### Authentication

- Provider: Google Sign-in
- Authorized domains must include the Netlify URL — set in Firebase Console → Authentication → Settings → Authorized domains

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

This uses `@resvg/resvg-js` to produce all PNG sizes and `favicon.ico`. This dependency is not installed on Netlify (icons are pre-committed), so it only needs to be run locally when the icon changes.
