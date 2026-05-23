# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript tool that generates draw.io (diagrams.net) custom shape libraries (`.xml`) from the IBM Carbon Design System icon set. It produces:

- 25+ categorized icon libraries containing 2,500+ icons, each composited onto colored backgrounds (one `.xml` per subcategory).
- An optional `IBM Carbon - Groups.xml` library of resizable "group" container shapes: a colored border + small vertical strip + icon + label, used to wrap other shapes in architecture-style diagrams. Selected per-icon via `CONFIG.groups`.

## Commands

- **Generate libraries:** `yarn generate` (runs `tsx src/index.ts`, outputs `.xml` files to `./output/`)
- **Lint:** `yarn lint` (ESLint with Airbnb + TypeScript + Prettier rules)
- **Install:** `yarn install` (requires Node.js v18+)

There is no build step, test suite, or CI pipeline.

## Architecture

The project is a data-transformation pipeline with five modules:

```
@carbon/icons metadata → index.ts → svgParser.ts → composer.ts → generator.ts → .xml files
```

- **`src/index.ts`** — Entry point and orchestrator. Imports Carbon icon metadata, filters deprecated icons, groups by subcategory. Runs two passes: (1) per-subcategory icon library generation, (2) a single combined Groups library from `CONFIG.groups`. Handles file I/O, label sanitization (`cleanLabel` strips ®/™/©/℠).
- **`src/config.ts`** — Two style schemas: `StyleConfig` (for icons) and `GroupStyleConfig` (for group containers). `CONFIG.categoryOverrides` tweaks per-subcategory icon styling; `CONFIG.groups` is a `Record<subcategory, GroupEntry[]>` listing which Carbon `name`s (kebab-case) become group shapes. Helpers: `getStyleForCategory()`, `getGroupStyleForSubcategory()`, `getGroupName()`.
- **`src/svgParser.ts`** — SVG parsing. `parseSvgContent()` extracts `<path>`, `<circle>`, and `<rect>` elements from Carbon SVGs. `parsePathData()` tokenizes and normalizes SVG path `d` attributes into absolute commands (M, L, C, Q, A, Z), expanding shorthands (H, V, S, T) and converting relative to absolute.
- **`src/composer.ts`** — Stencil composition. `createStencilXml()` builds the 48×48 icon-on-background stencil (background uses cell `fillColor`, icon hardcoded). `createGroupStencilXml()` builds the smaller strip+icon stencil (no outer border — that lives on a separate mxCell) used by group shapes.
- **`src/generator.ts`** — draw.io XML generation. `generateLibraryXml()` emits the standard single-cell icon library. `generateGroupLibraryXml()` emits a 2-cell mxGraphModel per entry: an outer container (border-only, transparent, `container=1`) plus a child cell with the strip+icon stencil and `labelPosition=right` so the label sits next to the icon. Both encode stencils with deflateRaw+base64 and wrap entries as JSON inside `<mxlibrary>`.

## Code Style

- ES modules (`"type": "module"` in package.json)
- Strict TypeScript (target ES2022, strict mode)
- Functions must use expression style (`const fn = () => {}`) — enforced by `func-style` rule
- Max line length: 80 chars
- Prettier: single quotes, trailing commas (es5), LF line endings
- 2-space indentation

## Customization

**Icon libraries.** Per-category style overrides live in `CONFIG.categoryOverrides`. Each override is a partial `StyleConfig` merged with global defaults. Default background: `#0f62fe` (IBM Blue), icon color: `#ffffff`, sizes: 48px bg / 24px icon.

**Group library.** Opt icons into the Groups library via `CONFIG.groups`, keyed by Carbon subcategory:

```ts
groups: {
  AI: ['watsonx-ai', 'watsonx-data', 'orchestrate'],
  User: [{ name: 'user-avatar', overrides: { stripColor: '#ff0000' } }],
}
```

Entry can be a bare string (Carbon `name`, kebab-case) or `{ name, overrides? }` to tweak the `GroupStyleConfig` for that entry. Border/strip/icon default to the subcategory's `bgColor`. Missing icon names log a warning and skip. All groups are emitted into a single `IBM Carbon - Groups.xml`.
