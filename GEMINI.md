# 🛡️ GEMINI Engineering Principles & Strict Quality Rules

This document establishes the mandatory engineering standards, architectural patterns, and quality gates for development within `civic-resolve`.

---

## 1. 🏗️ Cohesive Modular Design & Responsibilities
* **Single Responsibility Principle (SRP):** Every module, file, class, and function must have a single, well-defined responsibility.
* **Semantic & Cohesive Decomposition:** Never split functions blindly or hack code into arbitrary subroutines solely to appease a linter rule. If a function is complex, re-architect it logically into cohesive helper services, domain models, or pipeline steps with clear boundaries.
* **No Artificial Hacks:** Do not introduce synthetic objects, wrapper indirection, or artificial file splits to bypass thresholds. Keep abstractions meaningful and maintainable.

---

## 2. 📏 Code Metrics & Quality Constraints
* **Function Length:** Maximum function length **<= 35 lines** (excluding comments and blank lines).
* **Cyclomatic Complexity:** Complexity **<= 8** per function.
* **Nesting Depth:** Maximum nesting depth **<= 3**. Avoid deep `if`/`for`/`try` hierarchies; use early returns and guard clauses.
* **Duplication:** **0% code duplication** enforced via `jscpd` (`threshold: 0`). Extract reusable logic into shared utility/service modules.
* **Strict Type Safety:** Where TypeScript is applied, enforce `strict: true`, explicit return types, and strictly ban `any` (use `unknown` with narrowing or custom type guards).

---

## 3. 🏛️ Clean Architectural Layering
All server-side code must adhere strictly to linear, unidirectional layering:
```
routes ➔ controllers ➔ services ➔ middleware / utils
```
* **Routes (`server/src/routes`):** Declarative route definitions mapping paths and HTTP verbs to controller handlers, attaching route-level middleware.
* **Controllers (`server/src/controllers`):** Handle HTTP transport specifics (extracting params/body/query, setting status codes, invoking services). Controllers do not contain business logic.
* **Services (`server/src/services`):** Pure domain and business logic, external API integrations, calculations, and data persistence. Decoupled from Express `req`/`res`.
* **Middleware (`server/src/middleware`):** Request validation, authentication, rate limiting, error handling, and security headers.
* **Utils (`server/src/utils`):** Stateless, reusable, side-effect-free helper functions.

---

## 4. 🔒 Validation, Error Handling & Security
* **Strict HTTP 400 Validation:** Validate all input parameters (query, body, params) at the boundary via dedicated schema/middleware before reaching controller logic. Return clear `400 Bad Request` responses on invalid inputs.
* **HTTP 404 for Unknown Resources:** Return explicit `404 Not Found` for unrecognized entities, lookups, or unmapped routes.
* **Upstream Resilience & Timeouts:** All external HTTP calls must use `AbortSignal.timeout(5000)` (or an explicit timeout controller) to prevent hung requests.
* **Zero Injection / Zero XSS:**
  * **Strictly ZERO `innerHTML` or `eval`:** Never use `innerHTML`, `outerHTML`, `document.write`, or `eval()`.
  * Safe DOM manipulation only via `textContent`, `setAttribute`, or structured DOM node creation (`document.createElement`).
* **Security Headers & Defense-in-Depth:** Secure defaults using Helmet (CSP), restricted CORS, and AST-based security checks.

---

## 5. 🔍 Root Cause Diagnosis & Refactoring Process
Whenever any gate (`npm run gate`, `lint`, `dup`, `sec`, `test:cov`, `a11y`) fails:
1. **Never Apply Surface-Level Patches:** Do not disable rules (`eslint-disable`), ignore files, or apply superficial suppressions.
2. **Diagnose Root Code Smell:** Identify why the code exceeded complexity, introduced duplication, leaked memory, or failed tests.
3. **Formulate & Explain Refactoring Approach:** Document the root cause and explain the architectural refactoring strategy before modifying code.
4. **Execute Clean Refactoring & Re-verify:** Refactor for semantic clarity and verify against all gates.
