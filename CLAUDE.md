# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript tool that generates draw.io (diagrams.net) custom shape libraries (`.xml`) from the IBM Carbon Design System icon set. It produces 25+ categorized libraries containing 2,500+ icons, each composited onto colored backgrounds.

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

- **`src/index.ts`** — Entry point and orchestrator. Imports Carbon icon metadata, filters deprecated icons, groups by subcategory, then iterates through groups calling the parser, composer, and generator. Handles file I/O.
- **`src/config.ts`** — Global defaults (`StyleConfig`) and per-category style overrides. `getStyleForCategory()` merges category-specific overrides with defaults (bgColor, bgSize, iconColor, iconSize).
- **`src/svgParser.ts`** — SVG parsing. `parseSvgContent()` extracts `<path>`, `<circle>`, and `<rect>` elements from Carbon SVGs. `parsePathData()` tokenizes and normalizes SVG path `d` attributes into absolute commands (M, L, C, Q, A, Z), expanding shorthands (H, V, S, T) and converting relative to absolute.
- **`src/composer.ts`** — Stencil composition. `createStencilXml()` converts a `ParsedSvg` into a draw.io stencil XML `<shape>`, with a background rect using `fillColor` and icon shapes using a hardcoded color from config. Users can change the background color in draw.io; the icon color stays fixed.
- **`src/generator.ts`** — draw.io XML generation. Compresses stencil XML with deflateRaw+base64, builds `shape=stencil(...)` styles, mxGraphModel XML, and wraps shapes as JSON inside `<mxlibrary>` tags.

## Code Style

- ES modules (`"type": "module"` in package.json)
- Strict TypeScript (target ES2022, strict mode)
- Functions must use expression style (`const fn = () => {}`) — enforced by `func-style` rule
- Max line length: 80 chars
- Prettier: single quotes, trailing commas (es5), LF line endings
- 2-space indentation

## Customization

Per-category style overrides are defined in `src/config.ts` under `CONFIG.categoryOverrides`. Each override is a partial `StyleConfig` merged with global defaults. Default background: `#0f62fe` (IBM Blue), icon color: `#ffffff`, sizes: 48px bg / 24px icon.
