---
description: "Use when: working on the Vue.js frontend with Composition API"
applyTo: "front-end-vue/**"
---

# Frontend Vue Instructions (Vue 3/TypeScript)

## Architecture

The code under `src/` is layered, and dependencies point one way:

`api` → `stores` → `composables` → container components → presentational components

- `types.ts`: Domain types (`Vendor`, `Dish`, `VendorDish`, `Timeslot`, `TimeslotDay`). No optional or dual-cased fields.
- `api/`: One module per endpoint. Fetches and maps the API's shape to the domain types. This is the only place that knows the backend's field names. No Vue imports.
- `stores/`: Shared app state as plain composables with module-level state (`useCatalog`, `useTimeslots`). Each fetches its data once. Only the store file mutates its state; components read it and call its functions.
- `composables/`: Component-level logic (`useDishRandomizer`, `useDishTimeslots`). May use stores.
- `lib/`: Pure helper functions with no Vue imports (`random.ts`, `images.ts`).
- `components/`: Single File Components. Feature-specific groups get a subfolder (`components/randomizer/`).

### Rules
- Components never call `fetch` or import from `api/`; they go through a store.
- Only container components use stores: `App`, `VendorList`, `Menu`, `MenuItem`, `DaySelector`, `DishRandomizer`.
- Presentational components take props and emit events only (`TimeSlotList`, `DishDetailsDialog`, `CoverImage`, the `DishRandomizer*` views).
- A component does one job. Do not add props that switch it between two modes (e.g. "pass an item to fetch, or pass the data directly").
- Keep logic in plain functions in `lib/` where possible; composables add reactivity on top.
- New shared state goes in a store, not in provide/inject or a component.
- Do not use `<Suspense>` or top-level `await` in `<script setup>`. Stores expose an explicit status (`'loading' | 'ready' | 'error'`) that components render.

## Coding Standards
- Use TypeScript; the type check must pass (see Tools)
- Use Single File Components with `<script setup lang="ts">`
- PascalCase for component file names and in templates
- Multi-word component names; child components tightly coupled to a parent take its name as prefix (`DishRandomizerResult`); generic building blocks use the `Base` prefix (`BaseDialog`)
- Composables are named `useXxx` and return a plain object of refs
- Composable inputs that may be reactive are typed `MaybeRefOrGetter<T>` and read with `toValue()`
- Model state that has distinct phases as a discriminated union, not a phase flag plus nullable fields

## Component Layout
- **Props**: `defineProps<{ ... }>()` with an inline type; use `withDefaults` only when there are defaults
- **Emits**: `defineEmits<{ close: []; select: [id: string] }>()`
- **Two-way binding**: `defineModel` (e.g. `v-model:open` on `BaseDialog`)
- **Template refs**: `useTemplateRef()`
- **Templates**: Refer to props directly (`item.name`, not `props.item.name`); always set `:key` on `v-for`
- **Styles**: `<style scoped>`. A `class` on a component lands on its root element, so do not add a `class` prop
- **Dialogs**: Use `BaseDialog` with `v-model:open`; never call `showModal()`/`close()` directly. Put padding on the slotted content, not on the dialog

## Tools and Libraries
- **Vue 3.5+**: Composition API only; no state library (Pinia would be the next step if the stores outgrow plain composables)
- **Vite** on Node, with npm as the package manager (`npm install` to set up):
  - `npm run dev` for development (proxies `/api` to the backend on `localhost:8000`)
  - `npm run build` for the production build into `dist/`, which the backend serves
- **Type check**: `npm run typecheck` (`vue-tsc`). The build does not type-check, so run this before committing
- No linter or test runner is configured

## Project Structure
- `src/main.ts`, `src/App.vue`: Entry point and root component; `App` starts the catalog load
- `src/types.ts`, `src/api/`, `src/stores/`, `src/composables/`, `src/lib/`, `src/components/`: See Architecture
- `src/style.css`: Global styles and CSS custom properties (colors)
- `public/`: Public assets
- `vite.config.ts`, `tsconfig.app.json`: Build and TypeScript configuration

## Best Practices
- Keep components small and focused
- Prefer `computed` over a watcher that copies state
- Use `shallowRef` for state that is replaced as a whole
- Clean up timers and listeners (`onScopeDispose` in composables, `onUnmounted` in components)
- Use the browser's image handling: `<img>` (or `CoverImage`) with CSS `object-fit`, preloading via `lib/images.ts`
