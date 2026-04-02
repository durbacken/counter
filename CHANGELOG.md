# Changelog

## 2026-04-02

### Added
- Landing page on the login/sign-in screen: hero section with logo and tagline, 2×2 feature grid (Räkna, Bocka av, Samarbeta, Historik), sign-in card below, "Gratis & ingen annonsering" footer note; feature grid is hidden during auth flows
- Workspace description/notes field: editable in settings (auto-saved with debounce), shown subtly above categories in the workspace view with newline support, included in PNG and XLS exports
- Archiving workspaces instead of deleting: swipe action archives (not deletes); archived workspaces can be restored or permanently deleted from a collapsible section in the workspace list
- Read-only public share link: owner can toggle a workspace as public in settings; a `/view/:id` route shows the workspace without sign-in; Firestore rules allow unauthenticated reads for public workspaces
- Settings page access restricted to owners and admins; non-privileged members navigating to `/admin` are redirected back to the workspace view
- Admin role: owner can promote/demote members to admin in the members list; admins can access settings alongside owners

### Changed
- Swipe-to-reveal action on workspace cards changed from delete to archive for owners; leave action unchanged for non-owners
- XLS export is now only available when history is enabled; PNG export always available
- Notes are preserved on navigation away from settings (saved via debounce, explicit save on back, and flush on component destroy)

### Fixed
- Full dark mode support: Material toolbar, cards, expansion panels, form fields, dialogs, menus, snackbars, checkboxes, button toggles, autocomplete panel, and disabled flat buttons all themed correctly
- Chart.js canvas background and text colors adapt to dark mode in real time (live `matchMedia` listener)
- Comment dialog header text now visible in dark mode
- Settings checkbox labels (Historik / Kommentarer) now visible in dark mode
- Disabled "Lägg till" button now visible in dark mode

---

## 2026-04-01 (continued)

### Added
- Change history: every counter increment/decrement and checkbox toggle is recorded in Firestore (`workspaces/{id}/changes` subcollection)
- Comment dialog: after each change a dialog prompts for an optional comment; autocomplete suggests previous comments for the same category using substring matching; panel no longer opens until user taps the input
- Per-category history accordion at the bottom of the workspace view; header shows change count and comment badge without expanding
- Per-workspace feature flags (owner-only in settings): **Historik** toggles the history accordion; **Kommentarer** (only available when Historik is on) toggles the comment dialog — history is always saved regardless
- History view and comment badge respect the feature flags; XLS export only appears when history is enabled; comments hidden in history view when comments flag is off
- Export menu: "Dela / Exportera" opens a choice between **Bild (PNG)** and **Historik (XLS)** (proper Excel file via SheetJS, loaded on demand); direct PNG export when history is disabled
- PNG export footer includes logo (rounded, greyscale) + "© Koll på läget? · Durbacken Design" on both counter and checkbox exports
- Checkbox workspace PNG export: generates a full canvas with title, progress bar, and every category with a green checkmark or grey empty box
- Checkbox workspaces no longer show a chart — replaced with a progress bar card ("X av Y klara · N%")
- "Klar" button below the category list in settings, visible once at least one category exists
- Shared `FooterComponent` shown on all pages: single row with greyscale logo, app name, © copyright, mail icon; clicking opens the about dialog
- About dialog: app name, logo, personal text from Tobias Sjöbeck, email link, close button
- Local dev mode: in `isDevMode()`, `AuthService` and `WorkspaceService` are replaced by `DevAuthService` and `DevWorkspaceService` via Angular DI; these use `localStorage` + `BehaviorSubject` — no Firebase or emulators needed; just run `npm start`
- Email invite autocomplete: suggests emails of people who already share a workspace with you, filtered by substring as you type
- Drag-to-reorder categories in admin settings via Angular CDK drag-and-drop; order saved to Firestore immediately
- "Ny arbetsyta" FAB hidden on empty state (the empty state already has "Skapa din första"); FAB right-aligned when workspaces exist
- Empty state shows a subtle "Eller prova ett exempel" picker with predefined counter or checkbox workspace (4 example categories each)
- Nollställ (reset) now logs a history entry for each affected category with comment "Nollställd"
- App renamed from **Läget** to **Koll på läget?** across all surfaces (toolbar, login, manifest, index.html, PNG export footer, about dialog)

### Fixed
- Long category names in the chart no longer overlap bars — labels truncated to 18 chars with `…`; full name shown in tooltip
- Long category names in the history accordion header now truncate with `…` instead of overflowing when expanded

---

## 2026-04-01

### Added
- Settings gear icon is now only visible to workspace owners
- Non-owners navigating to `/workspace/:id/admin` are redirected back to the workspace view

### Fixed
- iOS PWA: toolbar now uses `padding-top: env(safe-area-inset-top)` + `height: auto` so buttons are not obscured by the status bar
- Invite dialog hint text updated to "Ett e-postmeddelande skickas med en inbjudningslänk."

---

## 2026-03-31

### Added
- Swipe-to-reveal delete/leave actions on workspace cards in the workspace list
- Checkbox mode as a second workspace type (alongside counter mode); mode is selected at workspace creation
- Email invite flow: owner can invite members by email; if they already have an account they are added immediately, otherwise a pending invite is stored and processed on their next sign-in (EmailJS used for sending)
- Subtle "about" footer on the workspace list screen
- App renamed from **Räknare** to **Läget**

### Fixed
- `@` symbol in email addresses now rendered correctly using the HTML entity
- Post-login redirect race condition: navigation waits for Firebase to confirm auth state before the route loads, preventing the auth guard from bouncing the user back to login
- Netlify: `netlify.toml` SPA redirect rule so refreshing any route serves `index.html`

### Changed
- Google sign-in reverted from redirect flow back to popup; the redirect approach had cross-origin/cookie issues in PWA contexts

---

## 2026-03-30

### Added
- Initial Angular 19 PWA counter app with multi-user Firebase backend
- Google Sign-in via Firebase Auth; user profiles stored in Firestore `users/{uid}`
- Workspaces with categories, counter increment/decrement, reset, and chart export (Chart.js)
- Workspace sharing: members list, remove member
- Project README

### Fixed
- Netlify build: pinned Node 20, set publish directory, switched to public npm registry via `netlify.toml`
- Removed `.npmrc` and `package-lock.json` from repo (contained corporate Nexus registry URLs causing Netlify build timeouts)
- Removed unused `@resvg/resvg-js` and test devDependencies to slim down the build
