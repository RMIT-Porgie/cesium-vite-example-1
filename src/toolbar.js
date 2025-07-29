// Create a Bootstrap dropdown at the top right corner
export function createToolbarDropdown() {
  // Create container div
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.left = "20px";
  container.style.zIndex = "1050";

  // Dropdown HTML using Bootstrap classes
  container.innerHTML = `
    <div class="dropdown">
      <button class="btn btn-secondary dropdown-toggle" type="button" id="toolbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        Tools
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="toolbarDropdown">
        <li><a class="dropdown-item" href="#" id="roi-option">Region of Interest</a></li>
        <li><a class="dropdown-item" href="#" id="measurement-option">Measurement</a></li>
        <li><a class="dropdown-item" href="#" id="pv-layout-option">PV Layout Design</a></li>
        <li><a class="dropdown-item" href="#" id="light-sim-option">Light Simulation</a></li>
      </ul>
    </div>
  `;
  document.body.appendChild(container);
}
