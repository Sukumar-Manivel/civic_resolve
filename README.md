# 🌟 Hack2Skill 100/100 Quality Starter Template

> **Hack2Skill Reusable Starter Template** — Pre-configured with zero-defect quality gates (ESLint complexity <= 8, max lines <= 35, jscpd 0% duplication, AST security checks, Vitest >95% coverage, and Axe WCAG 2.1 AA accessibility).

---

## 📌 Problem Statement

[Template Problem Statement: Define the challenge vertical, target user persona, core problem scenario, and expected outcomes.]

---

## 📋 Challenge Submission Rubric

### 1. Chosen Vertical
* **Vertical:** `[Challenge 6] Urban Air Quality Assistant`
* **Focus:** Winter smog health protection, indoor air quality filtration, and low-emission household commute planning.

### 2. Approach and Logic
* **Live Environmental Intelligence:** Real-time city geocoding and ambient pollutant retrieval via Open-Meteo (`PM2.5`, `PM10`, `US AQI`, `CO`).
* **AQI Severity Classification:** Deterministic categorization of air hazard levels.
* **Context-Aware Plan Generation:** Google Gemini (`gemini-2.5-flash` with strict JSON `responseSchema`) paired with deterministic rule-based offline fallback.
* **Impact Quantification:** Personal particulate exposure cut and lifecycle CO₂e reduction modeling.

### 3. How the Solution Works
* **Lightweight Backend:** Node.js + Express backend with strict HTTP `400` input validation middleware (`validateRequest.js`), HTTP `404` error handling for unrecognized locations, and `5s` `AbortSignal` upstream timeouts.
* **Resilient In-Memory Caching:** Bounded 100-entry FIFO/TTL caching to prevent rate-limiting and minimize latency.
* **Security Hardening:** Helmet CSP, origin-configured CORS, and non-root multi-stage Docker packaging.
* **Zero-Dependency Accessible Frontend:** Semantic HTML5, CSS3, and native ES modules (`textContent`-only DOM rendering, WCAG 2.1 AA compliant).

### 4. Assumptions Made
* **City Indexing:** Geocoding indexes populated cities/towns rather than administrative provinces/states (unrecognized region queries return a 404 search prompt).
* **Preset Fallback Hotspots:** Preset offline fallback readings apply to supported metropolitan hotspots during upstream network outages.
* **Standard Emission Factors:** Per-passenger-km lifecycle factors: Car (0.192 kg CO₂e/km), Motorbike (0.103 kg CO₂e/km), Bus (0.082 kg CO₂e/km), Carpool (0.064 kg CO₂e/km), Metro (0.028 kg CO₂e/km), Cycle/Walk (0 kg CO₂e/km). N95 masks filter ~80% transit PM2.5; indoor HEPA reduces exposure by ~65%.
