let issuesData = [];
let attachedImageData = null;
const currentFilter = { status: "", category: "", search: "" };

const CATEGORIES = [
  "Sanitation & Waste",
  "Roads & Transport",
  "Water & Sewerage",
  "Electrical & Lighting",
  "Public Safety & Parks",
  "General Administration"
];

function populateCategoryDropdowns() {
  const formCat = document.getElementById("input-category");
  const filterCat = document.getElementById("tracker-category");
  for (const cat of CATEGORIES) {
    const opt1 = document.createElement("option");
    opt1.value = cat;
    opt1.textContent = cat;
    formCat.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = cat;
    opt2.textContent = cat;
    filterCat.appendChild(opt2);
  }
}

function announce(msg) {
  const el = document.getElementById("aria-live-feedback");
  if (el) el.textContent = msg;
}

function updateMetrics(issues) {
  const total = issues.length;
  const reported = issues.filter((i) => i.status === "Reported").length;
  const progress = issues.filter((i) => i.status === "In Progress").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;

  document.getElementById("stat-total").textContent = String(total);
  document.getElementById("stat-reported").textContent = String(reported);
  document.getElementById("stat-progress").textContent = String(progress);
  document.getElementById("stat-resolved").textContent = String(resolved);
}

function createBadge(text, colorClass) {
  const badge = document.createElement("span");
  badge.className = `badge ${colorClass}`;
  badge.textContent = text;
  return badge;
}

function appendBadges(header, issue) {
  const badgesRow = document.createElement("div");
  badgesRow.className = "badges-row";

  const statusClass = {
    Reported: "badge-status-reported",
    "In Progress": "badge-status-progress",
    Resolved: "badge-status-resolved"
  }[issue.status] || "badge-status-reported";
  badgesRow.appendChild(createBadge(issue.status, statusClass));

  const priorityClass = {
    Critical: "badge-priority-critical",
    High: "badge-priority-high",
    Medium: "badge-priority-medium",
    Low: "badge-priority-low"
  }[issue.priority] || "badge-priority-medium";
  badgesRow.appendChild(createBadge(`${issue.priority} Priority`, priorityClass));

  header.appendChild(badgesRow);
}

function appendMetaAndDesc(card, issue) {
  const meta = document.createElement("div");
  meta.className = "issue-meta";
  const locSpan = document.createElement("span");
  locSpan.textContent = `📍 ${issue.location}`;
  const catSpan = document.createElement("span");
  catSpan.textContent = `🏷️ ${issue.category}`;
  const timeSpan = document.createElement("span");
  timeSpan.textContent = `🕒 ${new Date(issue.createdAt).toLocaleDateString()}`;
  meta.append(locSpan, catSpan, timeSpan);
  card.appendChild(meta);

  const desc = document.createElement("p");
  desc.className = "issue-desc";
  desc.textContent = issue.description;
  card.appendChild(desc);
}

function appendTriageAndNotes(card, issue) {
  const triageBox = document.createElement("div");
  triageBox.className = "issue-triage-box";
  const deptStrong = document.createElement("strong");
  deptStrong.textContent = `Assigned: ${issue.department} | Est: ${issue.estimatedResolutionHours}h SLA\n`;
  const reasonText = document.createTextNode(`Rationale: ${issue.urgencyReason}`);
  triageBox.append(deptStrong, reasonText);
  card.appendChild(triageBox);

  if (issue.resolutionNotes) {
    const resBox = document.createElement("div");
    resBox.className = "issue-resolution-box";
    const resTitle = document.createElement("strong");
    resTitle.textContent = "Resolution Log: ";
    const resText = document.createTextNode(issue.resolutionNotes);
    resBox.append(resTitle, resText);
    card.appendChild(resBox);
  }

  if (issue.imageUrl) {
    const img = document.createElement("img");
    img.className = "issue-thumb";
    img.src = issue.imageUrl;
    img.alt = `Photo attachment for issue: ${issue.title}`;
    card.appendChild(img);
  }
}

function buildIssueCard(issue) {
  const card = document.createElement("article");
  card.className = "issue-card";

  const header = document.createElement("div");
  header.className = "issue-header";
  const title = document.createElement("h3");
  title.className = "issue-title";
  title.textContent = issue.title;
  header.appendChild(title);
  appendBadges(header, issue);

  card.appendChild(header);
  appendMetaAndDesc(card, issue);
  appendTriageAndNotes(card, issue);

  return card;
}

function renderIssues(issues) {
  const container = document.getElementById("issues-container");
  container.textContent = "";

  if (issues.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No grievances match the selected filters.";
    container.appendChild(empty);
    return;
  }

  for (const issue of issues) {
    container.appendChild(buildIssueCard(issue));
  }
}

function createSelect(options, selectedValue) {
  const select = document.createElement("select");
  select.className = "form-select";
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    if (opt === selectedValue) el.selected = true;
    select.appendChild(el);
  }
  return select;
}

function buildAdminRow(issue) {
  const tr = document.createElement("tr");

  const tdTitle = document.createElement("td");
  const strong = document.createElement("strong");
  strong.textContent = issue.title;
  const pId = document.createElement("p");
  pId.className = "issue-meta";
  pId.textContent = `${issue.id} | ${issue.location}`;
  tdTitle.append(strong, pId);

  const tdDept = document.createElement("td");
  tdDept.textContent = `${issue.category}\n→ ${issue.department}`;

  const tdPri = document.createElement("td");
  const priSelect = createSelect(["Low", "Medium", "High", "Critical"], issue.priority);
  tdPri.appendChild(priSelect);

  const tdStatus = document.createElement("td");
  const statusSelect = createSelect(["Reported", "In Progress", "Resolved"], issue.status);
  tdStatus.appendChild(statusSelect);

  const tdNotes = document.createElement("td");
  const notesInput = document.createElement("input");
  notesInput.type = "text";
  notesInput.className = "form-input";
  notesInput.placeholder = "Enter resolution details...";
  notesInput.value = issue.resolutionNotes || "";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn-secondary-sm";
  saveBtn.style.marginTop = "0.35rem";
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => saveAdminUpdates(issue.id, statusSelect.value, priSelect.value, notesInput.value);

  tdNotes.append(notesInput, saveBtn);
  tr.append(tdTitle, tdDept, tdPri, tdStatus, tdNotes);
  return tr;
}

function renderAdminTable(issues) {
  const tbody = document.getElementById("admin-tbody");
  tbody.textContent = "";

  if (issues.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "empty-state";
    td.textContent = "No complaints available.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const issue of issues) {
    tbody.appendChild(buildAdminRow(issue));
  }
}

async function saveAdminUpdates(id, status, priority, resolutionNotes) {
  try {
    const res = await fetch(`/api/issues/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, resolutionNotes })
    });
    if (!res.ok) {
      const errData = await res.json();
      announce(`Failed to update issue: ${errData.error || "Unknown error"}`);
      return;
    }
    announce(`Issue ${id} updated successfully.`);
    await loadIssues();
  } catch (err) {
    announce(`Network error: ${err.message}`);
  }
}

async function loadIssues() {
  const params = new URLSearchParams();
  if (currentFilter.status) params.set("status", currentFilter.status);
  if (currentFilter.category) params.set("category", currentFilter.category);
  if (currentFilter.search) params.set("search", currentFilter.search);

  try {
    const res = await fetch(`/api/issues?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    issuesData = data.data || [];
    updateMetrics(issuesData);
    renderIssues(issuesData);
    renderAdminTable(issuesData);
  } catch (err) {
    const container = document.getElementById("issues-container");
    container.textContent = "";
    const errBox = document.createElement("div");
    errBox.className = "empty-state";
    errBox.textContent = `Error loading complaints: ${err.message}`;
    container.appendChild(errBox);
  }
}

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert("File exceeds maximum allowed size of 2MB.");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    attachedImageData = reader.result;
    const prev = document.getElementById("preview-thumbnail");
    const wrap = document.getElementById("image-preview-container");
    prev.src = attachedImageData;
    wrap.style.display = "flex";
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  attachedImageData = null;
  document.getElementById("input-image").value = "";
  document.getElementById("image-preview-container").style.display = "none";
}

function showFormFeedback(msg, isSuccess) {
  const box = document.getElementById("form-feedback");
  box.textContent = msg;
  box.className = `feedback-banner ${isSuccess ? "success" : "error"}`;
  announce(msg);
}

async function submitIssueForm(e) {
  e.preventDefault();
  const title = document.getElementById("input-title").value.trim();
  const category = document.getElementById("input-category").value;
  const location = document.getElementById("input-location").value.trim();
  const description = document.getElementById("input-description").value.trim();
  const submitBtn = document.getElementById("btn-submit-issue");

  submitBtn.disabled = true;
  submitBtn.textContent = "AI Triaging...";

  try {
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, location, description, image: attachedImageData })
    });
    const result = await res.json();
    if (!res.ok) {
      showFormFeedback(`Error: ${result.details ? result.details.join(", ") : result.error}`, false);
      return;
    }
    showFormFeedback(`Grievance submitted! Assigned to ${result.department} (${result.priority} Priority).`, true);
    document.getElementById("issue-form").reset();
    removeImage();
    await loadIssues();
  } catch (err) {
    showFormFeedback(`Network error: ${err.message}`, false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Grievance";
  }
}

function setupTabs() {
  const tabCitizen = document.getElementById("tab-citizen");
  const tabAdmin = document.getElementById("tab-admin");
  const viewCitizen = document.getElementById("view-citizen");
  const viewAdmin = document.getElementById("view-admin");

  tabCitizen.addEventListener("click", () => {
    tabCitizen.classList.add("active");
    tabCitizen.setAttribute("aria-selected", "true");
    tabAdmin.classList.remove("active");
    tabAdmin.setAttribute("aria-selected", "false");
    viewCitizen.style.display = "grid";
    viewAdmin.classList.remove("active");
  });

  tabAdmin.addEventListener("click", () => {
    tabAdmin.classList.add("active");
    tabAdmin.setAttribute("aria-selected", "true");
    tabCitizen.classList.remove("active");
    tabCitizen.setAttribute("aria-selected", "false");
    viewCitizen.style.display = "none";
    viewAdmin.classList.add("active");
  });
}

function setupFilters() {
  document.getElementById("tracker-search").addEventListener("input", (e) => {
    currentFilter.search = e.target.value.trim();
    loadIssues();
  });

  document.getElementById("tracker-category").addEventListener("change", (e) => {
    currentFilter.category = e.target.value;
    loadIssues();
  });

  const pills = document.querySelectorAll(".status-pills .pill-btn");
  for (const pill of pills) {
    pill.addEventListener("click", () => {
      for (const p of pills) {
        p.classList.remove("active");
        p.setAttribute("aria-checked", "false");
      }
      pill.classList.add("active");
      pill.setAttribute("aria-checked", "true");
      currentFilter.status = pill.dataset.status;
      loadIssues();
    });
  }
}

function init() {
  populateCategoryDropdowns();
  setupTabs();
  setupFilters();
  document.getElementById("input-image").addEventListener("change", handleImageSelect);
  document.getElementById("btn-remove-image").addEventListener("click", removeImage);
  document.getElementById("issue-form").addEventListener("submit", submitIssueForm);
  loadIssues();
}

window.addEventListener("DOMContentLoaded", init);
