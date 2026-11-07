# CAMPUS-PULSE — project memory

Fork `sripavan098-creator/CAMPUS-PULSE` (parent `vyrajavallineelam-dotcom/CAMPUS-PULSE`).
Demo frontend `campus-pulse-pied.vercel.app`; backend `campuspulse-backend-trww.onrender.com`.
Both deploy from the fork's `main`. (`campus-pulse-vignan.vercel.app` is a second frontend.)

## Deploy topology (important)
- Two frontends. The FINAL demo is `campus-pulse-pied.vercel.app`; it and the Render
  backend `campuspulse-backend-trww.onrender.com` both build from the FORK's `main`
  (`sripavan098-creator/CAMPUS-PULSE`). `campus-pulse-vignan.vercel.app` is the other one.
- So to deploy the demo: fast-forward the fork's `main` (a branch push alone does not).
  That single push redeploys both campus-pulse-pied (Vercel) and the Render backend.
- Render rebuilds the DB from `server/data/all_compiled_timetables.json` on every deploy
  (`startCommand`: prisma db push && npm run db:seed), so seed/data fixes need a redeploy.
- Vercel rewrites every non-`/api` path to `/index.html`, so unknown routes return 200.
- Frontend default API base is the Render URL (fallback in `src/config/apiConfig.ts`).
- PRs whose head is a FORK branch fail their Vercel checks ("Authorization required to
  deploy") — not a build failure; commits on a repo's own `main` do deploy.

## Timetable rendering (the accuracy core)
- `src/utils/timeUtils.ts` `buildTimetableColumns` derives grid columns from the start
  times that actually exist in the data; gaps become Break/Lunch. `TIME_SLOTS` is kept
  for other consumers but must NOT drive the grid — it drops classes whose start time is
  absent and collides consecutive classes.
- `WeeklyTimetableGrid` takes optional `bellEntries` used only to widen columns, so a
  section free during a period still shows that period.
- `selectBellEntries` + `familyKey` (same file) fill a section's free periods from its
  sibling sections. A section's own rows omit free periods, so the family is needed to
  know the full bell.
- Family pooling is NOT safe naively: some families run two bells. SASH (`I SASH SEC`,
  `I X SEC`, `I Y SEC`) mixes :05/:55 and :10/:00; `I X SEC-51/52/53` start lunch at
  12:50 while the rest of `I X SEC` start at 12:40. The helper drops sibling intervals
  that overlap the section's own classes and returns [] when the family's bells conflict.
- `familyKey` strips only a trailing section designator. Stripping the last token
  collapses `III CSBS` -> `III` and `I BS(DS)` -> `I`, dragging in every other program.
- Bell schedules differ per department+year. Distinct intervals span 08:15–16:05, some
  AIML to 17:15. II AIML sections run 8 periods with a 12:40 lunch.

## Campus routes
- All building URLs go through ONE route `/campus/:slug` in `src/App.tsx`. Do NOT add
  static `/campus/<name>` routes: a static route defines no `:slug` param, so
  `useParams().slug` is undefined and the page silently falls back to one fixed block
  (this made every block render Nagarjuna Bhavan).
- `src/utils/buildingUtils.ts` `findBuildingBySlug` matches slug or short block code
  (A/H/N/P/U) and returns undefined for an unknown slug instead of guessing.

## Room identity (availability accuracy)
- `src/utils/roomUtils.ts` splits two jobs that must stay separate:
  `roomMatchKey()` = aggressive grouping key (drops round AND square bracket notes,
  whitespace-separated `FLOOR` notes, spaces/hyphens, zero-padding) used ONLY to
  decide which labels are the same room. `canonicalRoomId()` = tidy bare `PREFIX NUM`
  codes only, so free-text labels survive (`SRAVANTHI SEMINAR HALL`,
  `107 DRAWING HALL, N BLOCK`).
- Do NOT strip a `FLOOR` form glued to the code (`LAB-12FLOOR`): it may be a room
  number. Only a whitespace-separated note is a note.
- Seed groups by `roomMatchKey`, keeps the confirmed catalogue spelling (else the
  most-entries / longest id), repoints aliases, deletes duplicates. `roomIdByKey`
  must be built from the SORTED kept head, not the unsorted group head (else FK
  violation on `entry.create`).
- Accuracy check that matters: 0 conflicting occupancy across alias rows. Current:
  176 rooms, 4029 entries, 406 faculty; timetables verify EXACTLY against
  `server/data/all_compiled_timetables.json` (140/140 sections, 137/137 rooms,
  406/406 faculty).
- Verify room endpoints with `urllib.parse.quote(rid, safe='')` — a bare `/AL/IL`
  room id is otherwise parsed as a path.

## Timetable default selection
- `/timetable` year-of-study selector defaults to 3, so the default section MUST be
  filtered by `yearOfStudy === 3` too. Otherwise the dropdown shows one section while
  the grid loads another (was `III AIML-A` vs `II AIML-J`).

## Data quality
- Faculty duplicates FIXED in `prisma/seed.ts`: `facultyIdFor` keys on a lowercased
  alnum-only form so spelling variants merge, and strips trailing separators before the
  `/faculty/i` generic-label test (else "DR. S. VINOTH -" stayed unlinked). Live went
  from 280 rows (37 trailing-hyphen, 13 dupes) to 406 clean rows, 0 dupes.
- Remaining (cosmetic, not yet done): some source legend cells merge two people,
  e.g. `Ms. P Mr. Sourabh Viswakarma`; and a few names differ only by letter
  ("K. Srinivasa Rao" vs "K. Srinivasarao") which the alnum key does not merge.

## Auth
- The login pages advertised hardcoded demo passwords the deployed backend rejects.
  `DEMO_CREDENTIALS` now reads `VITE_*_SEED_*` (or `*_SEED_*`) env vars, and the banner
  is hidden by `demoCredentialsConfigured()` when unset. Seed accounts come from
  `ADMIN_/FACULTY_/STUDENT_SEED_EMAIL|PASSWORD` (see `.env.example`). Never hardcode them.

## Local dev + verification
- Vite on port 12000, backend on 3001. The live `/availability` page needs up to ~60s
  (Render cold start) before it leaves the loader — slow, not broken.
- Cross-check grid changes with a `npx tsx` script that pulls every section from
  `/api/sections` + `/api/timetables` and asserts no dropped or overlapping columns.
  Last run: 141 sections, 0 problems.
- Full E2E accuracy recipe (used to prove the demo): read
  `server/data/all_compiled_timetables.json` as the source of truth, then compare live
  `/api/groups/:id/timetable`, `/api/rooms/:id/timetable` (quote `safe=''`),
  `/api/faculty/:id/timetable` by a normalized key (strip parentheticals, FLOOR notes,
  non-alnum, zero-padding). Expect 140/140 sections, 137/137 rooms, 406/406 faculty.
  A live count HIGHER than one source spelling is expected for faculty/rooms — variants
  are merged, not lost.
- Other live checks: all 3 frontends return 200 on every route and reference
  `campuspulse-backend-trww.onrender.com`; auth issues CSRF and returns 401 for bad
  creds; availability 418 available / 164 occupied with 0 cross-label conflicts.
