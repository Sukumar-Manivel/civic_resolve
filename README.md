# 🏛️ CivicResolve — AI-Powered Citizen Grievance Redressal System

> **CivicResolve** is an automated, AI-driven municipal grievance management and resolution platform. It empowers citizens to report community hazards, applies Google Gemini (`gemini-2.5-flash`) for real-time automated triage and department dispatch, calculates estimated resolution SLAs, and provides an end-to-end transparent tracking and municipal administration console.

---

## 📋 Challenge Submission Rubric

### 1. Chosen Vertical
* **Vertical:** `[Challenge 6] AI-Powered Citizen Grievance Management and Resolution`
* **Focus Area:** Real-time civic issue intake, automated multi-department triage (Roads, Sanitation, Water, Electrical, Public Safety), deterministic fallback classification, SLA turnaround prediction, and transparent lifecycle tracking from `Reported` to `Resolved`.

### 2. Approach and Logic
* **Automated Intelligent Triage:** High-velocity intake using Google Gemini (`gemini-2.5-flash` with strict structured JSON schema) to analyze citizen titles, descriptions, and locations into categorical classification, public hazard priority (`Low`, `Medium`, `High`, `Critical`), official department routing, and SLA resolution estimates.
* **Resilient Deterministic Fallback:** Graceful degradation via `triageRules.js` when `GEMINI_API_KEY` is not provided or upstream APIs encounter latency/network failure. Emits structured diagnostic warnings to stderr and routes grievances deterministically using semantic pattern matching.
* **Lifecycle State Transitions:** Strict state progression (`Reported` ➔ `In Progress` ➔ `Resolved`) backed by municipal administrative updates and resolution logging.
* **Defensive Boundary Validation:** Layered validation ensuring malformed payloads, oversized attachments, or unauthorized status transitions return deterministic HTTP 400 responses.

### 3. How the Solution Works
* **Architectural Layering:** Strict unidirectional architecture:
  ```
  routes ➔ controllers ➔ services ➔ middleware ➔ utils
  ```
* **Express 5 Backend:** Hardened with Helmet Content Security Policy (CSP), origin-configured CORS, bounded request limits (5MB body limit), and `AbortSignal.timeout(5000)` on upstream AI requests.
* **Pre-seeded In-Memory Storage:** Realistic civic grievances pre-populated on boot (pothole cluster, overflowing bin, sparking street cable, water pipeline breach) enabling immediate tracker and admin demonstration.
* **Accessible Zero-Dependency Frontend:** Semantic HTML5 (`<header>`, `<main>`, `<nav>`, `<section>`, `<fieldset>`, `<legend>`, `<label>`), responsive CSS, and native ES modules with strict `textContent`-only DOM construction (zero `innerHTML`, zero `eval()`) ensuring WCAG 2.1 AA compliance.

### 4. Assumptions Made
* **Municipal Department Mapping:** Six standardized departments cover all local civic functions: Solid Waste Management, Public Works & Highways, Water Supply & Sewerage Board, Electricity & Public Lighting Utility, Municipal Safety & Parks Directorate, and General Administration.
* **Image Payload Handling:** Attachments are accepted as base64 data URIs constrained to valid image MIME types (`png`, `jpeg`, `webp`) and capped at 2MB per attachment to preserve bandwidth and storage.
* **SLA Estimates:** Critical public safety risks (live wires, structural collapse) are targeted for <= 6 hours; major utility/transit disruptions target <= 24 hours; general sanitation issues target <= 48 hours.

---

## 🏗️ Architecture & Data Flow

```
   [Citizen Portal / Admin Console]
                  │
                  ▼
          [Express 5 Server]
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
[validateRequest.js]     [Static Assets (client/)]
     │
     ▼
[issuesController.js]
     │
     ▼
[issuesService.js]
     │
     ├──────────────────────────┐
     ▼                          ▼
[Google Gemini 2.5 Flash]  [Deterministic Fallback]
 (Strict JSON Schema + 5s)   (triageRules.js)
```

---

## 🚀 Local Setup & Development

### Prerequisites
* Node.js v18+ (tested on Node v20/v24)
* npm v9+

### Installation & Run
```bash
# Navigate to the starter project
cd "inter clg challenge/h2s-100-starter"

# Install dependencies
npm install

# Start development server
npm start
```
The application will be live at `http://localhost:8080`.

---

## 🧪 Quality Gate Verification

All quality gates enforce a zero-defect baseline:

```bash
# 1. Linting & Code Metrics (complexity <= 8, max-lines <= 35, max-depth <= 3)
npm run lint

# 2. Code Duplication Check (threshold: 0% duplication)
npm run dup

# 3. AST Security Scanner (zero eval, zero innerHTML, zero exposed keys)
node scripts/security-check.js

# 4. Vitest Unit & Integration Test Coverage (>95% coverage)
npm run test:cov

# 5. Accessibility Scan (WCAG 2.1 AA via Playwright + Axe)
npm run a11y
```

---

## ☁️ Google Cloud Run Deployment

Deploy containerized CivicResolve to Google Cloud Run in the `asia-south1` region:

```bash
gcloud run deploy civic-resolve \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080"
```
