# Changelog

## 2026-04-03

### Added
- **Last changed by** on workspace view: a subtle "Anna · 3 min sedan" line under each category name in normal view (not edit mode), showing who last changed that category and when
- **Last changed by** on workspace list cards: `lastActivityBy` and `lastActivityAt` fields stamped on the workspace document on every `logChange` call — no extra Firestore reads needed
- **Per-workspace color avatar**: deterministic color (derived from workspace ID) + first letter of title shown as a rounded avatar on workspace list cards and inside the workspace toolbar
- **Guest mode**: anonymous Firebase Auth sign-in via "Prova utan att logga in" button on login page; guest users see an amber warning banner explaining their data is temporary; "Skapa konto" signs them out to the login screen; anonymous users display as "Gäst" in change history
- **Offline indicator**: fixed banner that slides up from the bottom when the device loses connectivity and slides away when it reconnects; respects iOS safe-area inset
- **Skeleton loaders**: shimmer placeholder cards shown on the workspace list while `workspaces$` loads, and a skeleton toolbar + category rows on the workspace view while `workspace$` loads; uses existing CSS variables so dark mode works automatically
- **Haptic feedback**: `navigator.vibrate(10)` on counter increment, decrement, and checkbox toggle for a tactile feel on Android (silently ignored on iOS and desktop via optional chaining)
- **Duplicate workspace**: swipe action for owners on workspace list cards + toolbar button in settings; confirms with a dialog explaining the copy gets zeroed values; navigates to the new workspace on creation
- **Drag-to-reorder categories** from the main workspace view (in edit mode) using Angular CDK drag-and-drop — previously only available in settings
- **Reset individual category** (counter mode, edit mode only): reset button on each row, confirm dialog, undo via snackbar
- **Undo snackbar** improvements: 8 s duration, live countdown display, dedicated dismiss (✕) button, slim height using plain `<button>` elements instead of Material buttons
- **History section in settings**: always-visible collapsible change log in the settings page, even when the history feature flag is off — shows total change count in the toggle button
- **Inline add-categories panel** on empty workspace: clicking the step-1 card opens a multi-field input panel; Enter moves between fields; steps 2 & 3 are hidden while the panel is open
- **Feature card click hints** on login and workspace list pages: clicking a feature card briefly shows an arrow pointing to the sign-in / action buttons
- **"Klar" button** now sticky at the bottom of the settings page — always visible regardless of scroll position

### Changed
- Settings gear icon moved into the `more_vert` overflow menu to reduce toolbar clutter; menu always visible when user has settings access or there are values
- Workspace toolbar title now truncates with ellipsis rather than pushing action buttons off screen
- Checklist mode consistently listed before counter mode in all button groups across all views
- "Prova ett exempel" picker on empty workspace hides steps 2 & 3 while add panel is open
- About page back button now uses `Location.back()` instead of hardcoded navigate to `/`, so returning from "Se mer" lands on the page you came from
- Terminology simplified: "arbetsyta" → contextual plain language throughout; "kategorier" → "punkter"

### Fixed
- Long workspace names in the main toolbar no longer push share/settings buttons off screen

---

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
