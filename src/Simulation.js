// Simulation component logic for Cesium light shadows with modern design
export default function SimulationComponent() {
  const div = document.createElement("div");
  div.className = "space-y-6";

  // Header section
  const header = document.createElement("div");
  header.className = "text-center mb-6";
  const title = document.createElement("h2");
  title.textContent = "Light & Shadow Simulation";
  title.className = "text-2xl font-bold text-gray-800 mb-2";
  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Configure lighting and shadow effects for realistic visualization";
  subtitle.className = "text-gray-600 text-sm";
  header.appendChild(title);
  header.appendChild(subtitle);
  div.appendChild(header);

  // Main control card
  const controlCard = document.createElement("div");
  controlCard.className = "modern-card p-6";

  const cardTitle = document.createElement("h3");
  cardTitle.textContent = "Shadow Controls";
  cardTitle.className = "text-lg font-semibold text-gray-800 mb-4";
  controlCard.appendChild(cardTitle);

  const description = document.createElement("p");
  description.textContent =
    "Enable realistic lighting and shadow effects to enhance the visual quality of your solar panel design.";
  description.className = "text-gray-600 mb-6 text-sm leading-relaxed";
  controlCard.appendChild(description);

  const button = document.createElement("button");
  button.id = "shadowToggleBtn";
  button.className = "btn-modern w-full";
  button.textContent = "⚡ Enable Light Shadows";

  let shadowsEnabled = false;

  button.addEventListener("click", () => {
    const viewer = window._mainViewer;
    if (!viewer) {
      console.error("Cesium viewer not found");
      return;
    }

    if (!shadowsEnabled) {
      // Enable shadows
      enableShadows(viewer);
      button.textContent = "🌙 Disable Light Shadows";
      button.className = "btn-modern w-full";
      shadowsEnabled = true;
    } else {
      // Disable shadows
      disableShadows(viewer);
      button.textContent = "⚡ Enable Light Shadows";
      button.className = "btn-modern w-full";
      shadowsEnabled = false;
    }
  });

  controlCard.appendChild(button);
  div.appendChild(controlCard);

  return div;
}

function enableShadows(viewer) {
  try {
    // Enable shadow mapping
    viewer.scene.shadowMap.enabled = true;

    // Configure shadow map settings
    viewer.scene.shadowMap.size = 2048; // Shadow map resolution
    viewer.scene.shadowMap.maximumDistance = 10000.0; // Maximum shadow distance

    // Enable shadows for the globe
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.shadows = true;

    // Set up directional light for shadows
    const light = viewer.scene.light;
    if (light) {
      light.direction = new window.Cesium.Cartesian3(0.5, 0.5, -1.0);
      light.intensity = 1.0;
    }

    // Enable shadows for all entities and primitives
    viewer.scene.globe.enableLighting = true;

    console.log("Light shadows enabled successfully");
  } catch (error) {
    console.error("Error enabling shadows:", error);
  }
}

function disableShadows(viewer) {
  try {
    // Disable shadow mapping
    viewer.scene.shadowMap.enabled = false;

    // Disable lighting on globe
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.shadows = false;

    console.log("Light shadows disabled successfully");
  } catch (error) {
    console.error("Error disabling shadows:", error);
  }
}
