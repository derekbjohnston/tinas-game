<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- Added principles: Fun First, Simplicity, Player Experience, Iterative Playtest
- Added sections: Technical Constraints, Development Workflow
- Templates requiring updates: ✅ No updates needed (templates are generic and compatible)
- Follow-up TODOs: None
-->

# Tina's Game Constitution

## Core Principles

### I. Fun First (NON-NEGOTIABLE)

Gameplay and player enjoyment MUST take priority over technical elegance, code architecture, or feature completeness. Every decision — from physics tuning to UI layout — MUST be evaluated against the question: "Does this make the game more fun to play?" If a technically superior solution makes the game less enjoyable, it MUST be rejected.

### II. Simplicity

Start with the simplest implementation that delivers a playable experience. YAGNI (You Aren't Gonna Need It) applies rigorously: do not build systems, abstractions, or configurability until a concrete gameplay need demands them. Complexity MUST be justified by a measurable improvement to player experience. Prefer fewer well-polished mechanics over many half-finished ones.

### III. Player Experience

The game MUST feel responsive and smooth. Input handling MUST have no perceptible lag. Animations and transitions MUST convey game state clearly. Visual and audio feedback MUST reinforce player actions. Accessibility considerations (readable text, colorblind-friendly palette, keyboard support) SHOULD be addressed from the start rather than retrofitted.

### IV. Iterative Playtest

Features MUST be playable as early as possible. Each increment SHOULD produce a testable build that someone can pick up and play. Feedback from playtesting (even informal self-testing) MUST inform the next iteration. Do not spend extended time on features without verifying they feel right in-game.

## Technical Constraints

- **Stack**: React + TypeScript for UI and game rendering
- **Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
- **Performance**: MUST maintain 60 fps during normal gameplay
- **Build**: Standard React toolchain (Vite or Create React App)
- **State Management**: Keep it minimal — React state and context unless complexity demands otherwise
- **Assets**: Lightweight; prefer CSS/SVG/canvas over heavy image assets where practical
- **No backend required**: Client-side only unless a specific feature demands persistence

## Development Workflow

- Commit after each meaningful gameplay change so progress is never lost
- Keep the game runnable at all times — broken builds block playtesting
- Prioritize the core loop (movement, jumping, collision) before level design, menus, or polish
- Use browser DevTools and React DevTools for debugging; no complex observability stack needed

## Governance

This constitution defines the guiding principles for Tina's Game. All implementation decisions MUST align with these principles. When principles conflict, Fun First takes precedence, followed by Player Experience, then Simplicity.

Amendments to this constitution require:
1. A clear rationale for the change
2. Documentation of what is changing and why
3. Review of downstream specs and plans for consistency

**Version**: 1.0.0 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05
