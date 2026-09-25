# STUDYNUT

A cross-platform study companion for Cambridge and IB students in Grades 6–10, with syllabus-aware practice, exam preparation, a built-in study guide, and on-device progress.

## Run & Operate

- `pnpm --filter @workspace/studynut run dev` — run the Expo app through its managed workflow
- `pnpm --filter @workspace/studynut run typecheck` — typecheck the mobile app
- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env for the mobile preview: none. Study progress and preferences use local device storage.

## Stack

- pnpm workspaces, Node.js 24, TypeScript
- Expo Router, React Native, React Native Web, AsyncStorage
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/studynut/app/(tabs)/` — dashboard, practice, tutor, exam simulator, and profile routes
- `artifacts/studynut/context/StudyProvider.tsx` — local progress, grade, goal, bookmark, and theme state
- `artifacts/studynut/data/questions.ts` — bundled sample question bank and subject/grade mapping
- `artifacts/studynut/constants/colors.ts` — light and dark theme tokens
- `artifacts/api-server/` and `lib/api-spec/openapi.yaml` — shared API and its contract

## Architecture decisions

- STUDYNUT starts local-first so learners can use practice and save progress without creating an account.
- The tutor uses built-in explanations in preview mode; it does not claim to be a connected AI service.
- Question sets and extended-response guides are samples, not official Cambridge papers or mark schemes.
- The Expo app is the mobile product and also supports the web preview via React Native Web.

## Product

Students can select Grades 6–10, practise tagged sample questions, review mistakes and bookmarks, set daily goals, run timed Paper 2/Paper 4/custom sessions, and ask the built-in study guide for help. Progress and appearance preferences are saved locally.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Official syllabus scraping, cloud sync, PDF delivery, camera question solving, and live NutAI are not connected in this preview.
- Use the managed Expo workflow rather than starting Metro directly; it supplies the preview environment.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
