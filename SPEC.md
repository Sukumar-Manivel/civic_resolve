# 📋 SPEC.md — CivicResolve Specification & Data Contract

## 1. 🎯 Overview & Mission
**CivicResolve** is an automated, AI-powered citizen grievance management and resolution platform. It bridges municipal authorities and residents by enabling transparent issue reporting, automated triage via Google Gemini (`gemini-2.5-flash`), instant department routing, SLA resolution estimation, and comprehensive lifecycle tracking from `Reported` to `Resolved`.

---

## 2. 👥 User Personas & Scenarios

### A. The Concerned Citizen
* **Persona:** Urban resident navigating neighborhood hazards (potholes, open drains, power cable sparks, overflowing trash).
* **Goal:** Report complaints quickly without bureaucratic hurdles, understand who is responsible, and track real-time resolution progress.
* **Key Experience:** Fast reporting with optional photo attachment, immediate AI triage feedback, and status tracking.

### B. The Municipal Department Dispatcher
* **Persona:** Public sector administrative supervisor managing grievance routing across municipal wings.
* **Goal:** Eliminate misrouted complaints, prioritize critical public safety emergencies, and maintain audit trails.
* **Key Experience:** Auto-classified issues routed to the exact department (Public Works, Solid Waste, Water Board, Electricity Utility) with estimated resolution timelines.

### C. The Field Redressal Officer
* **Persona:** On-ground municipal engineer executing repairs.
* **Goal:** Acknowledge assigned grievances (`In Progress`), record field action notes, and mark issues `Resolved`.
* **Key Experience:** Admin management console with status transitions and resolution note logging.

---

## 3. 📊 Data Model & Schema Contracts

### `Issue` Entity Schema
```typescript
interface Issue {
  id: string;                          // Unique ID: civic-{timestamp}-{random}
  title: string;                       // Required: 3-100 characters
  description: string;                 // Required: 5-1000 characters
  location: string;                    // Required: 3-120 characters
  category: IssueCategory;             // Enum
  priority: IssuePriority;             // Enum: "Low" | "Medium" | "High" | "Critical"
  department: string;                  // Target municipal authority
  status: IssueStatus;                 // Enum: "Reported" | "In Progress" | "Resolved"
  urgencyReason: string;               // 1-2 sentence rationale for priority
  estimatedResolutionHours: number;    // Estimated resolution SLA hours
  triageSource: "gemini" | "rule-engine"; // Engine responsible for classification
  imageUrl?: string | null;            // Validated base64 data URI (max 512KB)
  resolutionNotes?: string | null;     // Official resolution remarks
  createdAt: string;                   // ISO 8601 UTC timestamp
  updatedAt: string;                   // ISO 8601 UTC timestamp
}

type IssueStatus = "Reported" | "In Progress" | "Resolved";
type IssuePriority = "Low" | "Medium" | "High" | "Critical";
type IssueCategory = 
  | "Sanitation & Waste"
  | "Roads & Transport"
  | "Water & Sewerage"
  | "Electrical & Lighting"
  | "Public Safety & Parks"
  | "General Administration";
```

---

## 4. 🤖 AI Triage & Deterministic Fallback Contract

### Gemini 2.5 Flash Triage (`gemini-2.5-flash`)
When `GEMINI_API_KEY` is configured:
* Request sends complaint context (`title`, `description`, `location`, user-selected `category`).
* Structured response schema guarantees:
  - `category`: Must match one of the 6 defined categories.
  - `priority`: Evaluated based on public safety hazards (`Critical` for immediate danger, `High` for severe disruption, etc.).
  - `department`: Official department assigned.
  - `urgencyReason`: Clear justification for public visibility.
  - `estimatedResolutionHours`: Practical SLA turnaround (6-72 hours).
* External calls bounded with `AbortSignal.timeout(5000)`.

### Deterministic Rule-Based Fallback
When `GEMINI_API_KEY` is missing or when the API times out / fails:
* Never fail silently or crash the submission.
* Log diagnostic warning to `process.stderr` with failure context.
* Apply semantic keyword and pattern classification (`triageRules.js`):
  - **Live wire / spark / dark street:** `Electrical & Lighting` $\rightarrow$ Electricity Utility (`Critical`, 6h).
  - **Pothole / crater / broken divider:** `Roads & Transport` $\rightarrow$ Public Works (`High`, 24h).
  - **Overflowing bin / open dumping / garbage:** `Sanitation & Waste` $\rightarrow$ Solid Waste (`Medium`, 12h).
  - **Contaminated water / broken main / sewage leak:** `Water & Sewerage` $\rightarrow$ Water Board (`High`, 18h).
  - **Open manhole / tree branch fall:** `Public Safety & Parks` $\rightarrow$ Parks Directorate (`Critical`, 8h).

---

## 5. 🔌 REST API Endpoints

### 1. `GET /api/health`
* **Response `200 OK`:** `{ status: "ok", timestamp: string, service: "civic-resolve", issuesCount: number }`

### 2. `GET /api/issues`
* **Query Parameters:**
  - `status`: Filter by `Reported`, `In Progress`, or `Resolved`.
  - `category`: Filter by standard category string.
  - `search`: Case-insensitive substring search in `title`, `description`, `location`.
  - `limit`: Number of issues to return (default: 50, max: 100).
  - `offset`: Pagination offset index (default: 0).
* **Response `200 OK`:** Array of `Issue` summary objects (`hasImage: boolean`, without full image bloat) sorted by `createdAt` descending.

### 3. `GET /api/issues/:id`
* **URL Parameter:** `id` — Issue unique identifier.
* **Response `200 OK`:** Full `Issue` object including base64 `imageUrl` payload.
* **Error `404 Not Found`:** `{ "error": "Issue with ID '...' not found" }`

### 4. `POST /api/issues`
* **Request Body:**
  ```json
  {
    "title": "Severe pothole cluster near Central Market",
    "description": "Deep craters across the intersection causing vehicle damage and traffic gridlock.",
    "location": "Corner of MG Road & 4th Avenue",
    "category": "Roads & Transport",
    "image": "data:image/jpeg;base64,..."
  }
  ```
* **Validation (HTTP 400):**
  - Null or non-object body.
  - Missing/empty or non-string `title`, `description`, `location`.
  - Invalid category (if provided).
  - Invalid image format or size $> 512\text{KB}$.
* **Response `201 Created`:** Newly created `Issue` with AI triage fields populated.

### 5. `PATCH /api/issues/:id/status`
* **Request Body:**
  ```json
  {
    "status": "In Progress",
    "priority": "Critical",
    "department": "Public Works & Highways Department",
    "resolutionNotes": "Inspection crew dispatched with asphalt patcher."
  }
  ```
* **Validation:**
  - HTTP `400` if no update fields supplied, invalid status enum, or invalid priority enum.
  - HTTP `404` if issue ID does not exist.
* **Response `200 OK`:** Updated `Issue` object.

---

## 6. 🎨 Accessibility & UI Architecture
* Strict zero-`innerHTML`, zero-`eval()` rendering.
* Semantic HTML5 (`<header>`, `<main>`, `<nav>`, `<section>`, `<fieldset>`, `<legend>`, `<label>`).
* WCAG 2.1 AA compliant color contrast, explicit keyboard focus rings, and `aria-live="polite"` feedback regions.
