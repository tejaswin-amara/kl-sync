# Redesign reference notes

## Apple design
Source: https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md

The Apple design reference emphasizes immediate response on pointer-down, direct manipulation, interruptible animation, spring-based transitions, velocity handoff, momentum projection, spatial consistency, gesture-direction hints, and soft rubber-band boundaries. For kl-sync, this translates into short press feedback, restrained spring entrances for sheets/drawers, source-anchored popovers, non-blocking interactions, and reduced-motion fallbacks. The reference also calls for translucent materials and depth, optical typography, restraint, predictable safety cues, and user-centered feedback.

## OpenDesign
Source: https://github.com/nexu-io/open-design

OpenDesign presents a design workflow centered on establishing a design system before implementation, keeping a brief, reusable visual language, live preview, critique, and iteration. Relevant takeaways for kl-sync are to define a brand contract (color, typography, spacing, radii, shadows, motion), reuse it across login/dashboard/module screens, and verify via real browser rendering rather than relying on isolated component assumptions.

## UI UX Pro Max
Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The UI UX Pro Max reference recommends generating a complete tailored design system: product/category pattern, visual style, colors, typography, effects, anti-patterns, and a pre-delivery checklist. It specifically stresses no emoji icons, cursor affordances, accessible contrast, visible focus states, reduced-motion support, text reflow at narrow widths, resilient chips/badges, cancellable interactions, and responsive checks at 375px, 768px, 1024px, and 1440px.

## Applied direction for KL Sync

KL Sync is a student ERP portal, so the redesign should feel like a calm academic command center rather than a generic dark admin panel. Use a light-first, editorial utility interface with deep ink text, warm paper surfaces, indigo as the primary action color, and teal/amber semantic accents. Keep the sidebar persistent on desktop, use compact bottom navigation on mobile, use clear hierarchy and bento-like dashboard composition, and reserve translucency for chrome/sheets rather than every card. Avoid neon gradients, excessive glassmorphism, decorative motion, color-only status meaning, and dense unstructured tables.

The implementation should preserve all existing API/data logic, auth flow, profile/photo handling, language selector, compliance modal, AI copilot, mobile drawer, and ERP route coverage while changing the visual system and presentation layer.

## Additional repository reference findings

### addyosmani/agent-skills
Source: https://github.com/addyosmani/agent-skills

Use a lifecycle of define → plan → build → verify → review → ship. Relevant rules for this task are spec before code, small atomic tasks, incremental implementation, test/build evidence, code simplification, security review, performance measurement, and a final quality gate.

### microsoft/agent-governance-toolkit
Source: https://github.com/microsoft/agent-governance-toolkit

Use deterministic policy gates and auditability at action boundaries rather than relying only on prompts. For KL Sync, preserve existing session/security boundaries, avoid changing auth or ERP request contracts during a visual redesign, and make AI copilot actions remain explicit, inspectable, and non-destructive.

### vudovn/ag-kit
Source: https://github.com/vudovn/ag-kit

Keep workspace rules, production checklists, safe updates, validation, and rollback paths explicit. Relevant takeaway: changes should remain reviewable and reversible, and verification should cover lint, typecheck, build, tests, and browser checks.

### DietrichGebert/ponytail
Source: https://github.com/DietrichGebert/ponytail

Apply a necessary-code ladder: first ask whether a feature or visual element needs to exist, then reuse existing code, then use native platform features, then the smallest implementation that works. Never cut security, validation, error handling, or accessibility. This directly informs the requested debloat pass.

### Panniantong/Agent-Reach
Source: https://github.com/Panniantong/Agent-Reach

Use capability layers with preferred and fallback routes, diagnose availability, keep credentials local, and avoid unnecessary wrappers. For KL Sync this reinforces preserving existing fallback/error states and keeping the frontend’s data access surface simple rather than introducing new abstraction layers during redesign.

### DeusData/codebase-memory-mcp
Source: https://github.com/DeusData/codebase-memory-mcp

Use structural code intelligence concepts: map architecture, routes, call chains, impact of changes, dead code, and near-duplicate patterns before deleting anything. For this task, perform a conservative dead-presentation audit and do not remove domain logic without evidence that it is unused.

### anthropics/skills
Source: https://github.com/anthropics/skills

Use self-contained, progressively loaded skills with clear metadata, repeatable instructions, examples, and verification. For KL Sync, keep design decisions and any new shared UI rules localized and documented rather than scattering undocumented conventions.

### gothinkster/realworld
Source: https://github.com/gothinkster/realworld

Keep frontend and backend contracts modular and testable against stable specifications. Preserve the existing KL Sync route/API boundary while changing presentation, and validate the frontend against real states rather than demo-only markup.

### spring-petclinic/spring-petclinic-reactjs
Source: https://github.com/spring-petclinic/spring-petclinic-reactjs

The supplied README endpoint did not return extractable content in this pass. Treat it as an architecture/reference implementation to inspect only if needed during implementation; do not infer details from the unavailable README.

### t3-oss/create-t3-app
Source: https://github.com/t3-oss/create-t3-app

The repository root README redirects to CLI documentation in the current branch. Relevant takeaway is type-safe, modular full-stack boundaries; no stack migration is planned for KL Sync.

### anthropics/skills
Source: https://github.com/anthropics/skills

Keep project-specific guidance self-contained, progressively loaded, and repeatable. Design and verification conventions should be documented where they are used instead of copied broadly into unrelated files.

### gothinkster/realworld
Source: https://github.com/gothinkster/realworld

Use stable API contracts and shared end-to-end validation to keep frontend implementations modular. Preserve KL Sync’s existing route/API contracts while changing its visual layer, and verify against real loading/error/empty states.

### t3-oss/create-t3-turbo
Source: https://github.com/t3-oss/create-t3-turbo

Use clear package boundaries, shared UI packages, shared lint/TypeScript conventions, and separate server-only code from client runtime code. KL Sync stays a single Next app, but its shared components should remain the source of truth rather than duplicating styles per route.

### calcom/cal.diy
Source: https://github.com/calcom/cal.diy

Use production-oriented self-hosting discipline: environment-sensitive behavior, explicit secrets, database/API boundaries, and real E2E smoke checks. No backend migration is planned; the relevant principle is to avoid visual changes that accidentally alter auth, session, or deployment contracts.

### shadcn-ui/ui
Source: https://github.com/shadcn-ui/ui

Treat UI components as editable local source, customized in the repository rather than hidden behind a dependency. Extend KL Sync’s existing primitives in place and keep component APIs stable.

### kamranahmedse/developer-roadmap
Source: https://github.com/kamranahmedse/developer-roadmap

The supplied README endpoint did not return extractable content in this pass. Its roadmap-oriented reference will be used only as a lightweight information-architecture principle: keep the product’s routes discoverable, grouped by user goal, and easy to scan.

### practical-tutorials/project-based-learning
Source: https://github.com/practical-tutorials/project-based-learning

Prefer learnable, incremental implementation slices and avoid introducing infrastructure solely because it is available. For this redesign, keep changes understandable within the existing Next.js app and verify each vertical slice.

### codecrafters-io/build-your-own-x
Source: https://github.com/codecrafters-io/build-your-own-x

Use first-principles understanding when changing core behavior, but do not rebuild established primitives unnecessarily. This supports the debloat rule: reuse existing route logic, native HTML controls, and existing local UI components before adding dependencies.

### donnemartin/system-design-primer
Source: https://github.com/donnemartin/system-design-primer

Scope use cases and constraints first, identify bottlenecks and trade-offs, then validate the design. For KL Sync, preserve availability under ERP failure by retaining cache-first and explicit loading/error states; do not trade resilience for a visually simpler but brittle UI.

### ocornut/imgui
Source: https://github.com/ocornut/imgui

The supplied README endpoint did not return extractable content in this pass. Its relevance is limited because KL Sync is a web app; no ImGui dependency or desktop UI pattern will be introduced.

### rust-lang/rust
Source: https://github.com/rust-lang/rust

The supplied repository is a language/compiler project and is not a direct frontend reference. Its relevant engineering principle is strict correctness and explicit contracts; no Rust code or dependency is needed for this redesign.

### kunchenguid/no-mistakes
Source: https://github.com/kunchenguid/no-mistakes

Use a safe Git workflow: review the exact diff, avoid accidental file changes, commit deliberately, and preserve rollback clarity. The final redesign will be committed only after build, lint, test, and browser checks.

## Reference usage boundary

“All repositories” are being used as a reference set, not as dependencies to install or code to copy. Design/UI sources influence the visual system and component quality; engineering/governance sources influence scope, safety, verification, and debloat; unrelated language/desktop repositories are explicitly noted and will not inflate the web app.
