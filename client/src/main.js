export function initApp() {
  const statusElement = document.getElementById("system-status");
  if (statusElement) {
    statusElement.textContent = "Operational and Ready";
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", initApp);
}
