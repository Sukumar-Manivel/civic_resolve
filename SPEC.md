# 📋 Specification & Problem Statement

This specification document outlines the problem requirements, architecture, API contract, and acceptance criteria for today's challenge.

---

## 1. 🎯 Problem Statement
* **Vertical:** `[Challenge 6] Urban Air Quality Assistant`
* **Core Problem:** 
  Urban residents face severe health risks from seasonal winter smog, hazardous particulate spikes (PM2.5 / PM10), and high ambient air pollution. Commuters and households need real-time environmental awareness, actionable low-emission transit alternatives, and predictive health recommendations.
* **Target Personas:**
  1. **Urban Commuters:** Need real-time route air hazard assessment and low-emission commute planning (car/bike vs. metro/bus/carpool).
  2. **Vulnerable Residents:** Sensitive groups (asthmatics, children, elderly) requiring immediate protective actions (indoor HEPA guidance, N95 masking advice).
  3. **Eco-conscious Citizens:** Seeking measurable quantification of their personal carbon and particulate exposure reduction.

---

## 2. 🚀 Core Features & Functional Requirements
* **Feature 1: Live Environmental Intelligence & Geocoding**
  - City lookups with geocoding.
  - Real-time ambient pollutant retrieval (`PM2.5`, `PM10`, `US AQI`, `CO`).
  - Strict fallback to preset metropolitan hotspots if upstream services are unreachable.
* **Feature 2: Deterministic AQI Severity Classification**
  - Standardized EPA AQI categories: Good (0-50), Moderate (51-100), Unhealthy for Sensitive Groups (101-150), Unhealthy (151-200), Very Unhealthy (201-300), Hazardous (301+).
* **Feature 3: Context-Aware Recommendation Engine**
  - Protective health actions tailored to pollutant thresholds.
  - Commute mode optimization with emissions and exposure savings calculations.
* **Feature 4: Impact & Exposure Quantification**
  - Lifecycle CO₂e emission comparison across transit modes.
  - Particulate matter inhalation reduction estimates.

---

## 3. 🔌 API Specifications
* `GET /health` - Service health and upstream readiness.
* `GET /api/air-quality?city=:city` - Fetch real-time or cached AQI metrics and advisory for a given city.
* `POST /api/commute-plan` - Calculate low-emission commute alternatives and exposure impact based on origin, destination, and transit mode.

---

## 4. 🛡️ Quality & Verification Criteria
* **Linting & Complexity:** ESLint complexity <= 8, max function lines <= 35, max depth <= 3.
* **Duplication:** 0% code duplication via `jscpd`.
* **Security:** AST checks clean, `npm audit` 0 high/critical vulnerabilities.
* **Test Coverage:** Vitest unit/integration coverage >= 95% lines, functions, statements, >= 90% branches.
* **Accessibility:** WCAG 2.1 AA verified via Playwright + Axe-core (`npm run a11y`).
