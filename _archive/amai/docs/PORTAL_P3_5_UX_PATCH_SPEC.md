# PORTAL — P3.5 UX CORRECTIVE PATCH · TECHNICAL IMPLEMENTATION SPECIFICATION

Single source of truth: `AMAI_PORTAL_MASTER_PLAN.md` — **Parts IV/V/VI are authoritative; Part VI is
the execution truth**; Parts I–III are legacy. This spec implements **Part VI §VI.5 (P3.5 scope)** and
the Part V patterns **§V1 (status), §V2 (clickable rows), §V3 (editable blocks), §V4 (avatar
auto-upload)**. Inspected against the live repo. **No build yet.**

**P3.5 is code-only: no migration, no DB/RLS/permission/audit-schema change, no new server actions
(only thin client wiring around the existing P2/P3 actions).**

---

## 1. P3.5 objective

A **UX corrective patch** that brings the already-built P2/P3 UI up to the Part V standards, without
changing behaviour, data, or security:
- **CP1** clickable rows (whole row opens the detail; no "View"-button-only).
- **CP2** editable blocks (pencil lock/unlock; read-only by default).
- **CP3** avatar auto-upload (no Upload button).
- **CP4** shared `StatusBadge` (generic, reused from P3 `UserStatusBadge`).

It reuses every existing server action, query, validation, RLS and audit path unchanged.

## 2. Dependency check (verified in repo)

| Dependency | Path | P3.5 use |
|---|---|---|
| `UserTable` | `src/components/portal/users/UserTable.tsx` (server) | CP1: row becomes clickable. |
| `UserDetailHeader` | `src/components/portal/users/UserDetailHeader.tsx` (server) | CP4: render `StatusBadge`. |
| `UserStatusBadge` | `src/components/portal/users/UserStatusBadge.tsx` (server) | CP4: re-implement as a thin wrapper over `StatusBadge`. |
| `RoleBadge` | `src/components/portal/users/RoleBadge.tsx` | unchanged (role is not a status). |
| `ProfileForm` | `src/components/portal/profile/ProfileForm.tsx` (client) | CP2: wrap name fields in `EditableBlock`. |
| `UserDetailActions` | `src/components/portal/users/UserDetailActions.tsx` (client) | CP2: wrap the **Name** block only. |
| `AvatarUpload` | `src/components/portal/profile/AvatarUpload.tsx` (client) | CP3: auto-upload, drop the Upload button. |
| `Avatar` | `src/components/portal/ui/Avatar.tsx` (client) | CP3: render local-preview src; unchanged API. |
| `Spinner` | `src/components/portal/ui/Spinner.tsx` | loading state for save/upload. |
| status palette | `src/lib/status/colors.ts` (`StatusToken`, `STATUS_COLORS`, `statusColor`, `userStatusToken`) | CP4 colour source. |
| existing actions | `modules/profile/actions.ts` (`updateMyProfile`, `uploadMyAvatar`, `removeMyAvatar`), `modules/users/actions.ts` (`updateUserName`, …) | called **unchanged** by CP2/CP3. |
| server validation | `lib/security/upload.ts` (`validateAvatarMeta`, `sniffImageMagic`, `AVATAR_BUCKET`, `avatarObjectPath`) | unchanged; still the enforcement layer. |
| routes | `/app/users`, `/app/users/[id]`, `/app/profile` | unchanged; only their components are patched. |

**Browser-smoke status (item 3):** P2/P3 code is merged toward `main` (deploy issued), but the
**browser smoke is still PENDING / unconfirmed** — the last production screenshot showed a stale
preview-branch deploy, and no pass has been confirmed. P3.5 does **not** depend on the smoke result,
but because it patches the same components, **recommend confirming the P2/P3 smoke before or together
with the P3.5 smoke**. Not a blocker for writing or building this spec.

**Migration (item 4):** **none.** CP1–CP4 are presentational/client UX over existing data; `StatusBadge`
maps statuses that already exist (`active/invited/disabled`). No DB, RLS, permission, or audit change.

---

## 3. CP1 — Clickable rows (`§V2`)

**Pattern.** Any list/table row that opens a detail page is **fully clickable** via the
**stretched-link** technique — one real `<Link>` whose `::after` pseudo-element overlays the row.
This keeps **table semantics**, needs **no client JS**, and avoids invalid nested interactive
elements (inner controls are *siblings* of the anchor, never descendants).

**Implementation (UserTable, server component):**
- The `<tr>` becomes the positioning context + hover/focus host:
  `className="group relative cursor-pointer transition-colors hover:bg-ink/5 focus-within:bg-ink/5"`.
- The **name** (primary cell) is the row link with a stretched overlay:
  `<Link href={\`/app/users/${u.id}\`} aria-label={\`Open ${name}\`} className="font-medium text-ink after:absolute after:inset-0 after:content-[''] focus-visible:underline">{name}</Link>`.
  Because the `<tr>` is `relative` and the `<td>`s are static, `after:inset-0` covers the **whole
  row**.
- Remove the trailing **"View"** `<Link>` as the *primary* affordance. Optionally keep a small
  chevron/"Open" visual cue in the last cell as a **non-interactive** hint (or a second
  `aria-hidden` element) — the stretched link is the real target.
- **Inner controls (future tables with quick actions):** render them `relative z-10` so they sit
  **above** the `::after` overlay (clicks hit the control, not the row link); for any JS `onClick`
  handlers also call `e.stopPropagation()`. They must be real `<button>`/`<Link>` siblings, never
  nested inside the row anchor.

**Keyboard / focus:** the `<Link>` is natively focusable; **Enter** activates it (correct link
semantics). The row shows a focus state via `focus-within`. (Space is button-semantics; the row is a
link, so Enter is the standard. A Space handler is **not** added to avoid turning a link into a
button.)

**Reusable, future-safe:** extract the row classes + the `after:absolute after:inset-0` link pattern
into a documented convention (a tiny `rowLinkClass`/`stretchedLinkClass` constant in
`src/components/portal/ui/rowLink.ts`) reused by every future table (customers, contacts, projects,
products, documents, invoices, audit lists). If a future browser shows `<tr position:relative>`
artefacts, the documented fallback is a CSS-grid row-as-`<Link>` (no `<table>`), same a11y contract.

**Files:** update `UserTable.tsx`; add `src/components/portal/ui/rowLink.ts` (shared classes).

**Tests:** the row name link has `aria-label="Open …"` and the stretched `after:` class; the
table contains **no** standalone "View" primary link as the only target; structural check that no
`<a>`/`<button>` is nested inside the row anchor; (RTL) clicking the row navigates, clicking an inner
control (when present) does not.

---

## 4. CP2 — Editable blocks (pencil lock/unlock) (`§V3`)

**Reusable `EditableBlock` (client)** — `src/components/portal/ui/EditableBlock.tsx`.

**State model:** `readonly → editing → saving → (saved→readonly | error→editing)`.
- **readonly** (default): renders the read view + a **pencil** icon button (aria-label "Edit <title>").
- **editing** (pencil clicked): renders the edit view (inputs enabled) + **Save changes** + **Cancel**;
  pencil hidden.
- **saving**: Save shows the gold `!` `Spinner`; inputs disabled.
- **saved**: `state.ok` flips → block returns to **readonly**, Save/Cancel disappear, pencil returns,
  a **transient success** cue ("Saved") shown ~2s (cleared by timeout; respects reduced motion = no
  animation, just text).
- **error**: stay **editing**, keep the user's input, show a safe `state.error`.

**API (proposed):**
```
<EditableBlock
  title="Name"
  action={serverAction}            // existing useActionState-compatible action
  readView={<…current values…>}    // ReactNode
  editView={(pending) => <…inputs…>} // render-prop receives `pending`
  hiddenFields={{ userId }}        // optional hidden inputs (e.g. user detail)
/>
```
Internally: `useActionState(action, {})`; a `<form action>` wraps `editView`; `useEffect` watches
`state.ok` to return to readonly + start the success-cue timeout; **dirty tracking** via `onInput`
(set `dirty=true`); **Cancel** → if `dirty`, `window.confirm('Discard changes?')` then reset
(re-mount the edit view by bumping a `key`, or `form.reset()`), set readonly; **navigation/unsaved
guard** → `beforeunload` listener while `dirty` (and editing). Inputs use `defaultValue` (uncontrolled)
so reset is clean.

**Applied to:**
- **Profile name block** — refactor `ProfileForm.tsx`: the first/last-name fields move into an
  `EditableBlock` (read view shows the names; edit view = the existing inputs; action =
  `updateMyProfile`). Email stays read-only outside the block (never editable).
- **User detail name block** — refactor `UserDetailActions.tsx`: wrap **only the Name `<form>`** in an
  `EditableBlock` (action `updateUserName`, hidden `userId`). 

**Explicitly NOT editable-blocks (unchanged):**
- **Role** (a `<select>` that triggers `changeUserRole`) — a **status/role transition**, kept as its
  own control with its confirm; not a lock/unlock text field.
- **Status / Disable / Enable** and **Resend / Password reset** — **destructive / transition /
  side-effect actions**, kept separate with their own confirms (per §V3).
- **Avatar** — follows **CP3**, not the editable-block pattern.

**Accessibility:** pencil + Cancel are real `<button>`s with text/aria-label; Save has an accessible
name; success/error use `role="status"`/`role="alert"`; focus moves to the first input on unlock;
reduced motion respected (no transition on the success cue).

**Files:** create `EditableBlock.tsx`; update `ProfileForm.tsx`, `UserDetailActions.tsx`.

**Tests (RTL):** block renders read-only with a pencil and no inputs/Save; clicking pencil shows
inputs + Save + Cancel and hides pencil; a successful action returns to read-only + pencil; an error
keeps edit mode + input; Cancel discards; dirty-guard `confirm` fires when canceling a changed block.

---

## 5. CP3 — Avatar auto-upload (`§V4`)

**Refactor `AvatarUpload.tsx` (client).** Remove the **Upload** button. Selecting **or dropping** a
file **auto-starts** the existing `uploadMyAvatar` action.

**Mechanics:**
- Keep `useActionState(uploadMyAvatar, {})` inside a `<form action={upload} ref={formRef}>` with a
  hidden-styled `<input type="file" name="file" accept="image/png,image/jpeg,image/webp">`.
- **Auto-submit:** the file input's `onChange` (and the dropzone's `onDrop` after assigning the file
  to the input via a `DataTransfer`) calls `formRef.current.requestSubmit()` — no Upload button.
- **Local preview:** on selection, `const url = URL.createObjectURL(file)` → show it in `Avatar`
  immediately; **revoke** it (`URL.revokeObjectURL`) in a `useEffect` cleanup and when the server
  `state.ok`/`state.error` resolves (the signed URL prop then takes over).
- **Loading/progress:** while `uploading`, overlay the avatar with the gold `!` `Spinner` (server
  actions don't expose byte-progress, so this is an indeterminate spinner, documented as such).
- **Success:** server returns → page revalidates → the new **signed URL** prop replaces the preview.
- **Failure:** revert to the previous avatar (drop the preview), show a safe `state.error`; the file
  input is reset so the same file can be retried.
- **Remove photo:** stays a **separate explicit** `<form action={remove}>` button (unchanged).
- **Dropzone:** the avatar+label area is a labelled dropzone (`onDragOver`/`onDrop`,
  `aria-label="Upload a profile photo (PNG, JPG or WebP, up to 2 MB)"`), plus a visible
  "Choose a photo" affordance that opens the file picker (a `<label htmlFor>` or button focusing the
  input) so keyboard users can trigger it.

**Server validation unchanged (still the enforcement layer):** PNG/JPG/WebP, **2 MB**, magic-byte,
private `avatars` bucket, signed-URL display, path in `profiles.avatar_url`, **no** `getPublicUrl`,
signed URLs never persisted/logged. Optional client pre-check (type/size) only improves UX; the
server remains authoritative.

**Files:** update `AvatarUpload.tsx` (and, if useful, a tiny `useObjectUrl` hook in
`src/components/portal/ui/`).

**Tests (RTL):** no element with the "Upload" button remains; selecting a file auto-invokes the form
submit (mock the action, assert it was called); an invalid file (type/size) surfaces an error and
keeps the old avatar; the object URL is revoked on cleanup; **Remove photo** still renders and calls
`removeMyAvatar`.

---

## 6. CP4 — Shared `StatusBadge` (`§V1`)

**Create `src/components/portal/ui/StatusBadge.tsx` (server-safe presentational).**

**API:** `StatusBadge({ entityType, status, label?, size? })`.
- `entityType`: `'user'` now; extensible to `'invite' | 'email' | 'project' | 'product' | 'invoice' |
  'document'` later **without migration** (UI-only mapping).
- maps `(entityType, status) → StatusToken` via a small registry `statusTokenFor(entityType, status)`
  (dispatch table); `user` reuses `userStatusToken` (`active→done`, `invited→waiting`,
  `disabled→revoked`, future `archived→cancelled`); unknown → `system`.
- colour from `STATUS_COLORS[token]` (inline `bg`/`fg`), pill shape.
- `label`: optional override; default = Title-case of the status value, **no dashes** (e.g.
  `Past due`, not "Past-due"); space-separated words Title-cased.
- `size`: `'sm'` (default, `text-xs px-2 py-0.5`) | `'md'`.

**Migration of the existing badge:** re-implement `UserStatusBadge` as a one-line wrapper
`<StatusBadge entityType="user" status={status} />` (keeps its import sites + its existing test
green), and point new call sites (`UserTable`, `UserDetailHeader`) at `StatusBadge` directly. **No
new DB status values** are introduced in P3.5 (`archived` etc. are mapped in the registry for
future-readiness but not used until P4).

**Files:** create `StatusBadge.tsx`; update `UserStatusBadge.tsx` (wrapper), `UserTable.tsx`,
`UserDetailHeader.tsx`.

**Tests:** `statusTokenFor('user','active'|'invited'|'disabled')` → `done|waiting|revoked`; unknown
→ `system`; default label Title-cases + de-dashes; `archived` maps to `cancelled` (future-ready);
`UserStatusBadge` wrapper still renders the same output (compat).

---

## 7. Accessibility requirements

- **Clickable rows:** real `<Link>` (keyboard-focusable, Enter activates); `focus-within` ring on the
  row; `aria-label="Open <name>"`; **no nested interactive elements** (stretched `::after`, controls
  are siblings); inner controls have accessible names + `z-10`.
- **Editable blocks:** pencil/Save/Cancel are buttons with text or `aria-label`; focus moves to the
  first field on unlock; `role="status"`/`role="alert"` for success/error; dirty-guard uses an
  accessible `confirm`; reduced motion = no animated transitions (instant + text cue).
- **Avatar:** the file input/dropzone has an accessible name; the icon/avatar is **not** the only
  label (visible "Choose a photo" text + aria-label); spinner has `aria-busy`/`aria-label="Uploading"`.
- **Badges:** colour is **not** the only signal — the text label always accompanies the colour.

## 8. Security & data-integrity requirements

- **No DB writes** beyond the existing P2/P3 actions; **no new server actions** (only client wiring +
  presentational components). `EditableBlock`/`AvatarUpload` call the **existing permission-gated**
  actions unchanged.
- **No RLS / service-role / permission / audit-schema** changes. Avatar upload still runs through the
  existing server validation + private bucket + signed URL; **no `getPublicUrl`**, signed URLs never
  persisted/logged.
- **No service-role import in any client component** (CP components are client UX over server
  actions). No sensitive data enters client state beyond what P2/P3 already display (names, status,
  signed avatar URL, a transient local object URL).
- Editable blocks change **only** the fields the underlying action already allows (names); role/status
  remain their own gated transitions.

## 9. Files to create / update (repo-accurate)

**Create:**
- `src/components/portal/ui/StatusBadge.tsx` (CP4)
- `src/components/portal/ui/EditableBlock.tsx` (CP2)
- `src/components/portal/ui/rowLink.ts` (CP1 shared classes) *(small; optional but recommended)*
- *(optional)* `src/components/portal/ui/useObjectUrl.ts` (CP3 preview helper)
- tests: extend `src/modules/users/users.test.ts` (StatusBadge mapping) + new
  `src/components/portal/ui/EditableBlock.test.tsx`, `src/components/portal/profile/AvatarUpload.test.tsx`,
  `src/components/portal/users/UserTable.test.tsx` (RTL/structural).

**Update:**
- `src/components/portal/users/UserTable.tsx` (CP1 + CP4)
- `src/components/portal/users/UserDetailHeader.tsx` (CP4)
- `src/components/portal/users/UserStatusBadge.tsx` (CP4 wrapper)
- `src/components/portal/profile/ProfileForm.tsx` (CP2)
- `src/components/portal/users/UserDetailActions.tsx` (CP2, Name block only)
- `src/components/portal/profile/AvatarUpload.tsx` (CP3)

**Unchanged:** all `modules/*/actions.ts`, `queries.ts`, `schema.ts`, `lib/security/upload.ts`, RLS,
migrations, routes, history components.

## 10. Tests for P3.5

- Row is clickable: name link has `aria-label` + stretched `after:` class; no standalone primary
  "View"; no nested interactive in the row anchor; (RTL) row click navigates, inner control click does
  not.
- Editable block: starts read-only (pencil, no inputs/Save); pencil unlocks (inputs + Save + Cancel,
  no pencil); success → read-only + pencil; error → stays editing + keeps input; Cancel discards;
  dirty-guard confirm fires.
- Avatar: file-select auto-triggers upload (action called); **no Upload button** in the DOM; invalid
  file → error + old avatar kept; object URL revoked; Remove photo still works.
- `StatusBadge`: `active/invited/disabled` → correct token/colour + Title-case label; unknown →
  `system`; `archived` → `cancelled` (future-ready); `UserStatusBadge` wrapper compatibility.
- `npx tsc --noEmit` passes; **all existing P1/P2/P3 tests still pass**; `next build` passes.

## 11. Manual checks after implementation

Open `/app/users` → hover a row (pointer + hover tint) → click anywhere on the row opens the detail →
Tab to the row, press Enter to open → (when inner controls exist) clicking them does not open the
row. On `/app/profile`: the name block is read-only with a pencil → unlock → edit → Save (returns to
read-only + success) → unlock → Cancel (discards, dirty-guard prompts). Same on the user detail name
block. Avatar: selecting/dropping a file **auto-uploads** (no Upload button) → success shows the new
photo → a failed upload keeps the old photo → Remove photo still works. Status badges still render
(Active/Invited/Disabled) with correct colours. Existing auth/profile/users/history flows still work.

## 12. Rollback plan

**Code-only.** Revert the P3.5 commit. No migration, no DB change, no data change. P2/P3 functionality
returns exactly as before (the actions/queries/validation were never touched).

## 13. Risks and open questions

- **`<tr position:relative>` + stretched `::after`** — works in evergreen browsers; documented grid
  row-as-`<Link>` fallback if any artefact appears.
- **Dirty-guard scope** — `beforeunload` covers tab close/refresh; in-app `<Link>` navigation guard is
  best-effort (a confirm on Cancel + on input-blur is the reliable part); full router-navigation
  blocking is out of scope for P3.5 (note as a future nicety).
- **Auto-upload via `requestSubmit()`** with server actions — standard; ensure the file input resets
  after an error so the same file can be reselected.
- **Object-URL cleanup** — must revoke on unmount and on resolve to avoid leaks (covered by the hook).
- **No-nested-interactive** invariant — enforce via a structural test so future table edits don't
  regress it.
- **Existing P3 tests** — keep `UserStatusBadge` wrapper + its test green; add new tests rather than
  rewriting.

## 14. Final readiness checklist

- **P3.5 spec ready:** **YES.**
- **Blockers:** none. Code-only, no migration; reuses all P2/P3 actions/validation.
- **Assumptions:** stretched-link rows (Enter-activated), reusable `EditableBlock` + `StatusBadge`,
  avatar auto-upload via `requestSubmit()` with optimistic object-URL preview, `UserStatusBadge` kept
  as a compat wrapper, no new DB status values. P2/P3 browser smoke is **pending** but not a blocker.
- **Exact approval question:** *"Approve P3.5 as specified — code-only CP1 clickable rows, CP2
  `EditableBlock` lock/unlock on the profile + user-detail name blocks, CP3 avatar auto-upload, CP4
  shared `StatusBadge` — with no migration/DB/permission/audit change and all P2/P3 actions reused
  unchanged? On approval I build P3.5 only and stop."*

No code is written until this is approved.
