# HTML-First Architecture

## Overview

This project uses an **HTML-First Architecture** for UI rendering, which ensures that user-provided HTML is rendered as-is in a secure sandbox, preserving all original behavior without React conversion.

## Core Principles

1. **No React Conversion**: User-provided HTML is never converted to React components
2. **Sandbox Isolation**: HTML is rendered in an iframe for complete isolation
3. **Behavior Preservation**: All original behaviors are preserved:
   - Tailwind config in `<script>` tags
   - `<style>` blocks
   - Body scroll, fixed/sticky positioning
   - Gradients, shadows, colors
4. **Behavior Injection**: Interactive behaviors are injected after HTML load via a global injector
5. **Host App Separation**: The React/Next.js host app only manages layout, routing, and AI orchestration

## Architecture Components

### 1. HtmlSandboxRenderer

**Location**: `src/components/canvas/HtmlSandboxRenderer.tsx`

Renders HTML content in an iframe sandbox:
- Preserves complete HTML documents (DOCTYPE, html, head, body)
- Supports HTML fragments (wraps in minimal HTML structure)
- Extracts and preserves Tailwind config from `<script>` tags
- Extracts and preserves all `<style>` blocks
- Injects Tailwind CDN for JIT compilation
- Ensures proper scrolling and positioning behavior

### 2. BehaviorInjector

**Location**: `src/components/canvas/HtmlSandboxRenderer.tsx` (class)

Injects interactive behaviors after HTML load:
- **Dropdowns**: Opens/closes dropdown menus
- **Tabs**: Switches between tab panels
- **Filters**: Filters list items based on data attributes
- **Action Buttons**: Handles submit, modal open, etc.
- **State Management**: Provides simple state store and API

### 3. UniversalHtmlRenderer

**Location**: `src/components/canvas/UniversalHtmlRenderer.tsx`

Wrapper component that:
- Uses `HtmlSandboxRenderer` for HTML-first rendering
- Extracts custom colors (for reference, not modification)
- Ensures outer container has no visual modifiers

### 4. LivePreview

**Location**: `src/components/canvas/LivePreview.tsx`

Main preview component that:
- Detects HTML vs React code
- Routes HTML to `HtmlSandboxRenderer` (HTML-first)
- Routes React code to existing React compilation pipeline
- Ensures no visual modifiers on containers

## Usage

### HTML Input

When HTML is detected, it's rendered via:

```tsx
<HtmlSandboxRenderer rawHtml={htmlContent} />
```

The HTML is:
1. Written to an iframe document
2. Preserved exactly as provided
3. Behaviors injected after load
4. Completely isolated from host app

### React Code Input

When React code is detected, it continues to use the existing JIT compilation pipeline.

## Behavior Injection API

The `BehaviorInjector` exposes a controlled API for AI to modify DOM structure:

```typescript
const api = getSandboxAPI();

// Update state
api.updateState('count', 5);

// Get state
const count = api.getState('count');

// Modify DOM
api.modifyDOM('.item', (el) => {
  el.classList.add('active');
});
```

## Constraints

### Host App (React/Next.js)

**MUST**:
- Only manage layout, routing, and AI orchestration
- Never wrap HTML content with opacity, filter, or visual effects
- Never alter HTML DOM unless via the injector API

**MUST NOT**:
- Convert HTML to React components
- Apply visual modifiers to HTML containers
- Modify HTML structure directly

### HTML Content

**PRESERVED**:
- All Tailwind classes and config
- All `<style>` blocks
- All inline styles
- All DOM structure
- All attributes

**INJECTED**:
- Event handlers for interactivity
- State management API
- Data binding

## Benefits

1. **1:1 Visual Fidelity**: UI visuals match original HTML exactly
2. **No React Bugs**: No React-induced rendering issues
3. **AI Evolution**: AI can still reason about, modify, and evolve the UI via API
4. **Complete Isolation**: Sandbox prevents conflicts with host app
5. **Behavior Preservation**: All original behaviors work as intended

## Migration Notes

- Existing React code continues to work via JIT compilation
- HTML content now uses HTML-first rendering
- No breaking changes for existing React components
- Behavior injection is automatic for HTML content



