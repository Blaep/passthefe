# AGENTS.md - PassTheFE (draft for owner review)

Legend: (verified) describes the repo as it exists today. (proposed) is a new
rule that needs owner sign-off before it binds anyone.

## What this is (verified)

Static practice site for the NCEES FE Civil exam. Plain HTML/JS/JSON, no build
step today. GitHub `main` auto-deploys to Cloudflare Pages at
https://passthefe.pages.dev.

## Run it (verified)

- Local: `python3 -m http.server 8000` from the repo root, open http://localhost:8000.
- No install, no bundler, no test directory today. Verification is the QA
  checklist below.

## Layout (verified)

- `index.html` - shell, loads all JS with `?v=` cache-bust query strings.
- `js/app.js` - app logic. Fetches `data/questions.json?v=N`; bump N on every bank change.
- `js/generators_<chapter>.js` - randomized variants per handbook chapter.
  Variants appear only in Randomized mode. `buildGenerator` rejects non-distinct options.
- `data/questions.json` - the question bank (~1056 questions, 1.3 MB).
- `data/equations.json`, `data/formulas.json` - handbook equation/formula data.
- `data/citation-links.json` - built by `tools/link_citations.py`. Do not hand-edit.
- `data/handbook-index.json`, `data/handbook-structure.json` - handbook navigation.
- `handbook/pages/pg-NNN.webp` - page scans of the FE Reference Handbook 10.6,
  the citation source of truth. NNN is the PDF page number: printed page N
  lives at pg-(N+6).webp (HANDBOOK_PAGE_OFFSET = 6 in js/app.js).
- `diagrams/<chapter>-NNN.svg` - SVG diagrams; questions reference them via the `diagram` field.
- `tools/` - python maintenance scripts. Read the docstring before running.

## Interface and experience (proposed, from owner-accepted guidance)

UX - the person using the app:
- Remove redundant interface taglines and helper labels ONLY when the layout
  and controls stay clear without them. Test: after removal, a first-time user
  can still tell what every visible control does.
- Never remove teaching explanations, accessibility attributes (labels, alt
  text, focus states, contrast), or instructions needed to complete a task.
- Check: quiz flow stays fully usable at a 375px-wide phone viewport.

DX - the developer maintaining it:
- Every repo fact an agent needs lives in this file or one pointer away.
- Every check below is reproducible: its steps are written precisely enough
  that two people running them get the same result. Where a check needs
  judgment, the checklist says what to look at.

AX - the AI working on it:
- Make the smallest change that satisfies the task. No drive-by refactors.
- When unsure between two readings of a task, stop and ask instead of picking one.
- Never claim a handbook standard, exam rule, or citation without pointing at
  the source file or printed page it came from.

## Content standards, question bank

- Every handbook citation must be real: it exists in the printed FE Reference
  Handbook 10.6 with the correct printed page number, verifiable against
  `handbook/pages/pg-NNN.webp` (see the page-offset line under Layout).
  Never invent a section, page, or equation number.
- Explanations teach: walk the solution steps, name the handbook section,
  keep wording simple enough for a first-time candidate.
- `tools/link_citations.py` links citations by exact section-name match only.
  Never guess a match; leave it unlinked.
- Question media fields are `videoUrl` / `videoTitle` on the question object
  and on generator metas. Question diagrams use the `diagram` field with a
  path under `diagrams/`.
- Question stems and choices keep units consistent: if the stem asks for a
  unit, every choice is in that unit and distractors are not unit conversions
  of the answer. Generator variants must produce distinct, non-equivalent options.
- (proposed) Derived formulas, factors, and conversions are labeled as
  derived and show their source (which printed equation or table they come
  from). This is the standard for new and touched content; it does not
  certify that the existing bank already meets it.

## Checkable rules (verified mechanics)

1. JSON parses: `python3 -m json.tool data/questions.json > /dev/null` after every edit.
2. Every change to `data/questions.json` bumps `?v=` in `js/app.js`, and the
   bump is part of the same reviewed artifact, never added later unreviewed.
3. Every change to a `js/*.js` file bumps its `?v=` in `index.html`.
   (`sw.js` is passthrough by design - its header says nothing is cached -
   so query strings are the only cache control.)

## QA checklist before any publish (verified as the established bar)

1. `python3 -m json.tool` passes on every edited JSON file.
2. Serve locally and complete a real quiz flow: load, answer, confirm, see solution.
3. Repeat the quiz flow at a phone-sized viewport (375px). A local harness is
   not a substitute: it does not verify loading, caching, or the real answer flow.
4. Every question touched that has a `diagram` field renders its SVG on the page.
5. Every citation touched: open the deep-linked `pg-NNN.webp` page and confirm
   it shows the cited section (the "(p. N)" links target exact scan pages).
6. The exact artifact (including cache bumps) passes second-agent review.
7. The owner approves the reviewed artifact.
8. After deploy, verify live: fetch `data/questions.json?v=N` (expected bytes,
   valid JSON), then load the site and start a real quiz.

## Review, publish, and shared-repo coordination

1. (verified) Prepare changes as one self-contained diff. Do not mix unrelated
   fixes, refactors, or formatting sweeps into a question-content change.
2. (verified) Second-agent review of the exact diff, then owner approval,
   before anything is committed to `main`.
3. (verified) Publish the reviewed diff exactly as approved. If a publish step
   fails mid-way, restore the last valid state of `main` first, then retry.
4. (proposed) Multiple agents work this repo. Before starting, `git fetch` and
   build on the latest remote `main` HEAD; never push a stale local copy over
   newer work; review branch previews before anything reaches `main`.

## Stop and ask the owner before (proposed)

- Deleting or renumbering questions, or changing any answer key.
- Bulk regenerating or rewriting large parts of the bank.
- Adding a build system, framework, or package manager. (The site is static
  today; whether it stays that way is the owner's call, not an agent's.)
- Changing this file's review/publish flow.
- Any commit to `main` without the review above.

## Do not (verified repo constraints)

- Do not commit local review harnesses or scratch files (`review-*.html`,
  `data/*.bak-*`). Keep them untracked.
- Do not hand-edit generated files (`data/citation-links.json`).
- Do not edit `data/questions.json` through the GitHub web editor: it truncates
  files over ~720K chars on commit. Use git from a clone.
- Do not claim NCEES affiliation anywhere in copy.
