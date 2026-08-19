# Ponytail Reference Notes

Source: <https://raw.githubusercontent.com/DietrichGebert/ponytail/main/README.md>
Repository: <https://github.com/DietrichGebert/ponytail>

## Principles applied to this audit

Ponytail’s central rule is not to minimize tokens blindly. It is to write only what the task needs while never cutting validation, error handling, security, or accessibility. The audit therefore treats code deletion and simplification as valid improvements only when the preserved behavior and acceptance criteria remain explicit.

The implementation ladder is:

1. Does this need to exist? If not, skip it.
2. Is the capability already in the codebase? Reuse it instead of rewriting it.
3. Can the standard library do it? Prefer that.
4. Is there a native platform feature? Prefer that.
5. Is a dependency already installed? Use it before adding another dependency.
6. Can the requirement be met with one clear line or a small local change? Prefer the smallest correct implementation.
7. Only then add the minimum new abstraction or dependency that works.

The ladder runs after understanding the real flow. The audit must read the code touched by a change, trace trust boundaries and data flow, and validate the result. It must remain lazy about solution size, never lazy about reading or correctness.

## Audit and quality commands from Ponytail

The repository’s review-oriented concepts are represented in this task by a whole-repository audit, a diff/debt review, and a final deletion-oriented quality gate. Ponytail’s own commands include `/ponytail-review` for over-engineering in the current diff, `/ponytail-audit` for whole-repository over-engineering, `/ponytail-debt` for deferred shortcuts, and `/ponytail-gain` for measured impact.

## Concrete KL Sync implications

The final backlog must identify redundant wrappers, duplicated route markup, unnecessary dependencies, repeated visual tokens, duplicated fetch/cache logic, speculative abstractions, unbounded effects, and low-value UI. It must not remove CAPTCHA/session validation, error states, data-loss handling, security boundaries, accessibility semantics, or test coverage merely to reduce lines. Every deletion or consolidation needs a reason and verification evidence.
