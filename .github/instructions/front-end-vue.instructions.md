---
description: "Use when: working on the Vue.js frontend with Composition API"
applyTo: "front-end-vue/**"
---

# Frontend Vue Instructions (Vue 3/TypeScript)

## Coding Standards
- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Use Single File Components (SFC) with `<script setup>`
- Follow kebab-case for component file names
- Use PascalCase for component names in templates
- Add TypeScript interfaces for data structures
- Use meaningful variable and property names

## Component Layout
- **Composition API**: Use `<script setup lang="ts">` for reactive logic
- **Reactive Data**: Use `ref()` and `reactive()` for state management
- **Computed Properties**: Use `computed()` for derived state
- **Lifecycle Hooks**: Use `onMounted()`, `onUnmounted()`, etc.
- **Template**: Keep templates clean and readable
- **Styles**: Use `<style scoped>` for component-specific styles
- **Props**: Define props with TypeScript interfaces
- **Emits**: Use `defineEmits()` for custom events

## Tools and Libraries
- **Vue 3**: Reactive framework
  - Composition API over Options API
  - `<script setup>` syntax
- **Vite**: Build tool and dev server
  - Run `deno run -A npm:vite` for development
  - Run `deno run -A npm:vite build` for production build
- **TypeScript**: Type checking
  - Use `.ts` for script files
  - Configure in `tsconfig.json`
- **Vue TSC**: Type checking for Vue files
- **ESLint/Prettier**: Code linting and formatting (if configured)
- Local development and building with Deno and Vite for optimal performance and modern features

## Project Structure
- `src/App.vue`: Root component
- `src/components/`: Reusable components
- `src/assets/`: Static assets
- `public/`: Public assets
- `vite.config.ts`: Vite configuration
- `tsconfig.json`: TypeScript configuration

## Best Practices
- Keep components small and focused
- Use composition functions for reusable logic
- Prefer `ref` over `reactive` for primitive values
- Use `shallowRef` for performance optimization when needed
- Handle async operations with `async/await`
- Use Vue DevTools for debugging
- Follow Vue 3 migration guide patterns