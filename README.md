# WonderQuest Math

WonderQuest Math is a small learning app for children about 8–10 years old. The first mission is **Star Pieces**, a Grade 4 space adventure about adding fractions that share a denominator.

Astro, a friendly astronaut, asks the child to put broken star pieces back together. The lesson teaches the idea first, then asks the child to use it: a fraction bar, a multiple-choice sum, a typed answer, a number line, and one more visual sum. A wrong answer is a chance to look again. After two misses, Astro offers a clue. After three, the mission shows the answer and lets the child continue.

## What you will see

1. **Home.** A big **Start Learning** button, three worlds to choose (space 🚀, dinosaurs 🦖, or soccer ⚽), a **More lessons** row for any extra lesson files, and a story path that shows how far the child got. The math stays the same. The colors, friend, emoji, and story change with the world.
2. **Story start.** The friend, the story (typed out like a book, with a 🔊 read-aloud button), the goal, and a big start button.
3. **Chapters.** A progress bar with the friend's emoji running along it and “Slide 3 of 7”. The friend says one short line, then the question card shows the prompt, a 🔊 button, a picture, and one of four puzzles: tap a colored answer tile, type on a big number keypad, tap a mark on a number line, or tap pieces to color them. A bottom bar holds **Back**, 💡 **Clue**, and **Check Answer**. A correct answer throws confetti and unlocks **Next**. A clue can be followed by “🔎 One more clue”.
4. **Mission complete.** A trophy, stars, a big score such as “4/5”, “You solved 4 out of 5 on your first try”, the idea in one sentence, a badge, **Play Again**, and a way back to Adventures.

Everything is sized for fingers: buttons are at least 56px tall, there is little text per screen, and nothing needs dragging.

Progress is saved on this device. If Supabase is not configured, the screen says **Saved on this device** and the bundled lesson still runs. It does not pretend to be online.

## Technology

- React 19 and TypeScript
- Vite
- Tailwind CSS
- React Router
- Motion (`framer-motion`)
- Lucide icons
- Zod
- Supabase PostgreSQL, optional
- Vitest and React Testing Library
- Playwright

## Prerequisites

- Node.js 22 or newer
- npm

Supabase is optional for local play.

## Install and run

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://127.0.0.1:5173`.

Other commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Environment

Copy the example file and fill in only what you have:

```bash
copy .env.example .env
```

| Variable | Where it is used |
| --- | --- |
| `VITE_SUPABASE_URL` | Browser. Your project URL. |
| `VITE_SUPABASE_ANON_KEY` | Browser. The anon public key only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script only. Never prefix it with `VITE_`. |

Leave the values blank, or skip the file, to use the bundled lesson. The anon key must look like a JWT (`header.payload.signature`) and the URL must be `https`. Anything else is treated as “not configured”.

## Two ways lesson data can load

**Bundled JSON.** `src/lessons/space-fractions.json` is validated at startup and is always available. This is the path used in local development and in tests.

**Supabase.** When the env variables are valid, the app can read published rows from `lessons` and save progress for an anonymous Supabase user. A remote lesson is cached for the next visit. The mission you already started does not swap content underneath the child.

Online save uses Supabase Anonymous Sign-Ins so Row Level Security can use `auth.uid()`. Turn that provider on in the Supabase dashboard. The app does not show a login screen. If sign-in or the network fails, progress stays in `localStorage` and the status line says online save will retry later.

No names, ages, or other personal details are stored.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/20261020120000_create_lessons_and_progress.sql`.
   With the Supabase CLI, `supabase db push` applies the same file.
3. In Authentication, enable **Anonymous sign-ins**.
4. Put the project URL, anon key, and service-role key in `.env`.
5. Seed the example lesson:

```bash
npm run seed
```

The seed script reads `src/lessons/space-fractions.json` and upserts one published row. It refuses to run without the service-role key. The browser never sees that key.

### Tables

`lessons` stores the published lesson: id, title, topic, grade, version, theme, full `lesson_data`, and timestamps.

`lesson_progress` stores one row per anonymous user and lesson: version, current slide id, per-task results, completed count, first-try count, and timestamps. `user_id` references `auth.users` and is never left empty. Policies let a signed-in user read and write only their own rows. Published lessons are readable by `anon` and `authenticated`. There is no client write policy on `lessons`.

## Lesson JSON

Lessons are data. React components do not contain the questions. Zod checks the file before it is shown.

A lesson has an id, version, title, description, grade, topic, objectives, theme, one intro slide, task slides, and one outro slide (6–12 slides in total; the bundled lessons have 5 tasks, the live AI story has 10). Task interactions are a discriminated union:

| `type` | What the child does | Correct answer field |
| --- | --- | --- |
| `multiple-choice` | Taps one tile | `correctOptionId` |
| `numeric-input` | Types `1/2`, `.5`, or `0.5` (all equal) | `correct` (a fraction) |
| `number-line` | Taps a mark on the line | `correct` (must sit on a mark) |
| `shade` | Taps pieces to color them | `correct` (e.g. 3/8 of `segments: 8`; any 3 pieces count) |

Each task also has `instruction`, `hint` (shown after the second miss), an optional `secondHint` (behind “One more clue”), `explanation` and `answerLabel` (shown after the third miss), and optional `supportingText` (what the friend says), `chapterTitle`, `story`, and `readAloud`. `theme.character.emoji` sets the emoji used on the progress bar, buttons, and number line.

Shortened shape:

```json
{
  "id": "space-fractions",
  "version": 1,
  "title": "Star Pieces",
  "grade": 4,
  "topic": "Adding fractions with the same denominator",
  "theme": { "id": "space", "character": { "name": "Astro", "illustration": "astronaut" } },
  "slides": [
    { "id": "intro", "type": "intro", "title": "Star Pieces", "story": "Welcome, Space Explorer!", "startLabel": "Start Mission" },
    {
      "id": "add-fifths",
      "type": "task",
      "instruction": "Astro has 1/5 of a star and finds 2/5 more. How much is that altogether?",
      "hint": "The pieces are all fifths. Add how many pieces you have: 1 plus 2.",
      "explanation": "The denominator stays 5. 1 plus 2 equals 3, which is 3/5.",
      "answerLabel": "3/5",
      "interaction": {
        "type": "multiple-choice",
        "correctOptionId": "three-fifths",
        "options": [
          { "id": "three-fifths", "label": "3/5", "accessibleLabel": "3 out of 5" }
        ]
      }
    }
  ]
}
```

The real file has the full theme, five challenges, and an outro: `src/lessons/space-fractions.json`. The schema is `src/schemas/lesson.schema.ts`.

### Add a lesson

1. Copy the JSON file into `src/lessons/` and give it a new `id`.
2. Keep the math honest. Distractors should be mistakes a child might really make, such as adding the denominators.
3. That is all. `src/features/lesson-library/catalog.ts` loads every `src/lessons/*.json`, validates it, and the home page lists it under **More lessons**. An invalid file is skipped with a console warning instead of breaking the app. Extra lessons keep their own story and world; the world picker only re-skins the main lesson.
4. Run `npm test`. Schema checks cover ids, slide order, contrast, number-line answers that miss the marks, and shade answers that are not whole pieces.
5. Seed it the same way if you want it in Supabase, or extend `scripts/seed-lesson.mjs`.

Raise `version` when you change a lesson that people may already have saved. Matching task ids keep their progress. Unknown saved slides are ignored.

### Generate a lesson with AI

```bash
npm run generate:lesson -- --topic "Subtracting fractions with the same denominator" --grade 4 --theme dino
```

`scripts/generate-lesson.ts` sends the topic, grade, chosen world, and the sample lesson as an example to Gemini. It asks for 5 tasks using at least 3 puzzle types, then runs the result through the same `parseLesson` schema the player uses. If the schema rejects it, the errors go back to the model for one retry. Only a valid lesson is written to `src/lessons/<id>.json`, and the script prints the URL to open. Add `--out file.json` to write somewhere else.

The schema checks structure (the answer is one of the options, sits on a number-line mark, is a whole number of pieces). It cannot prove the story math is right, so read a generated lesson before you ship it. `src/lessons/subtracting-fractions-with-the-same-deno.json` is one the script produced; every answer was checked by hand.

## Themes

The home screen offers three worlds: **space**, **dinosaurs**, and **soccer**. The choice is saved on this device. Colors, the friend’s name, and the drawing come from `src/themes/adventures.json`.

**New puzzles come from Gemini, not from a fixed worksheet.** Start Learning asks the dev server for 10 fresh Grade 4 questions about adding fractions with the same denominator. The server checks the math before the child sees anything: the pictured bar must match, sums must be right, and the “added the denominators” trap must be present. A failed draft is sent back to the model once. The key stays in `.env` as `GEMINI_API_KEY` and is never put in the browser.

The model is **Gemini 3.5 Flash-Lite** (`gemini-3.5-flash-lite`). It is the current low-cost Gemini model with a free tier and structured JSON. Get a key at [Google AI Studio](https://aistudio.google.com/apikey), add it to `.env`, and restart `npm run dev`. Set `GEMINI_MODEL` only if you want a different Gemini model.

`src/lessons/space-fractions.json` is the sample used by tests. It is not what a child plays after the key is set.

`applyAdventure` copies the chosen story onto a clone of the lesson and checks it with the same schema. A bad story cannot reach the player.

`ThemedScreen` copies validated colors and radius tokens onto CSS variables such as `--wq-primary`. Tailwind utilities read those variables, so a new palette updates buttons, cards, feedback, and the page background together.

Colors must be `#RRGGBB`. Text pairs must reach a contrast ratio of at least 4.5. The schema rejects other strings, so a lesson cannot inject CSS, HTML, or scripts through a color.

`character.illustration` must be `astronaut`, `dino`, or `player`. `background` is `starfield`, `jungle`, `pitch`, or `plain`. Decorations are `stars`, `planets`, `ferns`, `bones`, `balls`, and `goals`. To add another world, add an adventure object and, if it needs a new drawing, one component in `src/components/characters/` plus its id in `illustrationIds`. The player and the grader stay the same.

Motion is short: the friend bobs, fraction pieces pop in, and each slide slides up. If the device asks for reduced motion, those animations stop.

## Add a new slide type

`shade` (tap pieces to color them) was added this way, so it is a working example to copy.

1. **Schema.** Add a Zod object with a new `type` literal to the `interactionSchema` union in `src/schemas/lesson.schema.ts` (see `shadeSchema`). Add a `.refine` for anything that would make the task impossible.
2. **Grading.** Add a `case` to `checkAnswer` in `src/lib/answer-checker.ts`. Return `invalid` for empty or unreadable input so it does not cost an attempt.
3. **Component.** Build it in `src/components/interactions/` (see `ShadeInput.tsx`). It gets the interaction, the current response string, `onChange`, and whether the task is finished or revealed.
4. **Registry.** Add it to `interactionRegistry` in `src/components/interactions/registry.tsx`. The registry type is mapped over every interaction `type`, so TypeScript fails the build until you do.
5. **Tests.** Add grader tests (see `tests/unit/shade.test.ts`) and use it in a lesson JSON.

The lesson player asks the registry for a component. It never grows a new `if` for every question type, and attempts, hints, reveal, and scoring work for the new type with no extra code.

## Answer checking and scoring

Grading is plain TypeScript, not React.

- Fractions and decimals become reduced integer ratios in `src/lib/rational.ts` and `src/lib/fraction-parser.ts`. `1/2`, `2/4`, `0.5`, `.5`, and `0.50` are the same value. The parser does not use `eval` or floating-point comparison.
- Up to 6 decimal places are accepted. A trailing dot such as `5.` means 5. A zero denominator, `NaN`, `Infinity`, and values past 1,000,000 are rejected without crashing.
- For the sample numeric challenge, both fractions and decimals are allowed. Negatives are not. An unreadable answer does not spend an attempt.
- The same submitted answer cannot be checked twice in a row.
- Miss 1: “Not quite! Have another look.”
- Miss 2: “Here's a little clue!” plus the task hint.
- Miss 3: the answer and the one-line explanation. The challenge is complete, but it is not marked solved.
- A correct answer does not increase the attempt count. First-try means the first submission was correct. **Need a clue?** before any miss does not remove a first-try star.
- The final “4 out of 5” is the first-try count, not a made-up score. “You finished 5 challenges” counts every completed task, including ones solved together.
- Stars say “Solved on your own”, “Solved with practice”, or “Finished together”.

## Tests

```bash
npm test
npm run test:e2e
```

Unit tests cover the schema, fraction equality, attempt limits, scoring, navigation locks, and stale saves. Component tests play the mission in jsdom, including a full 5-out-of-5 run. Playwright covers a correct run, a hint, an answer reveal, refresh, back/forward scoring, and a 768×1024 tablet viewport.

Install the Playwright browser the first time:

```bash
npx playwright install chromium
```

## Decisions worth knowing

- The denominator says how big each piece is. The numerator says how many pieces. Same-size pieces keep the same denominator when you add.
- Tap targets are used instead of dragging.
- Read-aloud uses the Web Speech API only after the child presses the button. Celebration sounds stay off until the sound button is turned on.
- Animations follow the operating system’s reduced-motion setting.
- Anonymous progress in the database belongs to a Supabase anonymous user. There is no separate nameless `user_id` because Row Level Security needs `auth.uid()`.

## Known limitations

- This repository was not pointed at a live Supabase project, so the SQL and seed script are included and reviewed, but online save was not executed against a real database here.
- Anonymous sign-ins must be enabled or online save stays unavailable. Local save still works.
- A lesson downloaded from Supabase replaces the bundled copy on the next visit, not in the middle of a mission.
- Numeric answers accept equivalent fractions. The sample lesson does not ask children to simplify, and it does not teach mixed numbers.
- Space, dinosaurs, and soccer change the look and the story voice. The math topic stays “add fractions with the same denominator,” with a new set of 10 questions each time Start Learning is pressed.
- Generating questions needs `npm run dev` (or `npm run preview`) so the Gemini key stays on the server. A static file host cannot call the model by itself.
- There is no teacher dashboard, class roster, or account screen.

## Project map

```text
src/lessons/*.json                    lesson content (all files are loaded)
scripts/generate-lesson.ts            AI lesson generator
src/themes/adventures.json            space, dinosaur, and soccer looks
src/schemas                           Zod lesson, theme, and progress checks
src/lib                               fractions, grading, attempts, scoring, storage
src/components/interactions           choice, typing keypad, number line, shade
src/features/lesson-player           state machine and screens
src/services/supabase                 optional database access
supabase/migrations                   tables, triggers, and RLS
tests                                 unit, integration, and end-to-end
```
